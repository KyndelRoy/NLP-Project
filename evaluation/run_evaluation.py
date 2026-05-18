#!/usr/bin/env python3
"""One-shot evaluation runner for saved model results.

This script intentionally lives outside the model packages. It reads existing
datasets and artifacts, writes evaluation/sample result files under
evaluation/, and never trains or rewrites the running model artifacts.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from typing import Any

import joblib


ROOT_DIR = Path(__file__).resolve().parents[1]
EVALUATION_DIR = ROOT_DIR / "evaluation"
SAMPLE_DIR = EVALUATION_DIR / "sample_sets"
RESULTS_DIR = EVALUATION_DIR / "results"

REPORT_PATH = RESULTS_DIR / "evaluation_report.json"
SUMMARY_PATH = RESULTS_DIR / "evaluation_summary.csv"

LDA_DATASET_PATH = ROOT_DIR / "dataset" / "lda_training_dataset.csv"
LANGUAGE_MODEL_PATH = ROOT_DIR / "models" / "pkl" / "language_identifer.pkl"
LDA_ARTIFACTS = [
    ROOT_DIR / "models" / "pkl" / "lda_vectorizer.pkl",
    ROOT_DIR / "models" / "pkl" / "lda_model.pkl",
    ROOT_DIR / "models" / "pkl" / "lda_metadata.pkl",
]
BERTOPIC_DATASET_PATH = ROOT_DIR / "bertopic_classifier" / "bertopic_dataset.csv"

CANDIDATE_LABELS = ["food", "sports", "news", "laws", "education"]

BERTOPIC_MODELS = {
    "bertopic_en": {
        "title": "BERTopic (English)",
        "model_dir": ROOT_DIR / "bertopic_classifier" / "models" / "topic_english",
        "topics_csv": RESULTS_DIR / "bertopic_en_topics.csv",
        "columns": ["english"],
        "samples": [
            ("i want to cook chicken for dinner", "cook", "English food/cooking topic"),
            ("she is studying french at the university", "french", "English education/language topic"),
            ("he was arrested by the police", "police", "English police/news topic"),
            ("it is raining heavily outside", "rain", "English weather topic"),
            ("she is reading a book in the library", "book", "English reading/library topic"),
        ],
    },
    "bertopic_en_tl": {
        "title": "BERTopic (EN + TL)",
        "model_dir": ROOT_DIR / "bertopic_classifier" / "models" / "topic_english_tagalog",
        "topics_csv": RESULTS_DIR / "bertopic_en_tl_topics.csv",
        "columns": ["english", "tagalog"],
        "samples": [
            ("gusto kong kumain ng manok", "eating", "Tagalog food/cooking assignment"),
            ("nag-aaral siya ng pranses", "french", "Tagalog education/language assignment"),
            ("pumunta siya sa ospital", "hospital", "Tagalog hospital/health assignment"),
            ("nagbabasa ako ng libro", "book", "Tagalog reading/book assignment"),
            ("masarap ang kape", "coffee", "Tagalog coffee/food assignment"),
        ],
    },
    "bertopic_tri": {
        "title": "BERTopic (Trilingual)",
        "model_dir": ROOT_DIR / "bertopic_classifier" / "models" / "topic_trilingual",
        "topics_csv": RESULTS_DIR / "bertopic_tri_topics.csv",
        "columns": ["english", "tagalog", "cebuano"],
        "samples": [
            ("ganahan ko magluto og manok", "chicken", "Cebuano food/cooking assignment"),
            ("nagbasa siya og libro", "book", "Cebuano reading/book assignment"),
            ("gidakop siya sa pulis", "police", "Cebuano police/news assignment"),
            ("nag eskwela siya sa unibersidad", "university", "Cebuano education assignment"),
            ("gutom na gutom ako", "hungry", "Tagalog hunger/food assignment"),
        ],
    },
}

LANGUAGE_SAMPLES = {
    "english": [
        "The students reviewed their lessons before the final exam.",
        "My family cooked rice and chicken for dinner tonight.",
        "The mayor announced new rules during the morning briefing.",
        "She plays basketball with her classmates every weekend.",
        "The court explained the rights of every citizen clearly.",
        "A strong storm damaged several houses near the river.",
        "The teacher asked the children to read another book.",
        "He bought vegetables and fresh fish from the market.",
        "The police reported the incident to local officials.",
        "They practiced English conversation after school.",
    ],
    "tagalog": [
        "Nag-aral ang mga estudyante para sa kanilang pagsusulit.",
        "Nagluto kami ng kanin at manok para sa hapunan.",
        "Nagbigay ng bagong patakaran ang alkalde ngayong umaga.",
        "Naglalaro siya ng basketbol kasama ang mga kaklase.",
        "Ipinaliwanag ng korte ang karapatan ng bawat mamamayan.",
        "Sinira ng malakas na bagyo ang ilang bahay sa tabing ilog.",
        "Pinabasa ng guro ang mga bata ng isa pang aklat.",
        "Bumili siya ng gulay at sariwang isda sa palengke.",
        "Iniulat ng pulisya ang pangyayari sa mga opisyal.",
        "Nagsanay sila magsalita ng Tagalog pagkatapos ng klase.",
    ],
    "cebuano": [
        "Nagtuon ang mga estudyante para sa ilang eksaminasyon.",
        "Nagluto mi og kan-on ug manok para sa panihapon.",
        "Nagpahibalo ang mayor og bag-ong balaod karong buntag.",
        "Nagdula siya og basketbol kuyog ang iyang mga klasmet.",
        "Gipasabot sa korte ang katungod sa matag lungsoranon.",
        "Giguba sa kusog nga bagyo ang pipila ka balay daplin sa suba.",
        "Gipabasa sa maestro ang mga bata og laing libro.",
        "Mipamalit siya og utanon ug preskong isda sa merkado.",
        "Gisumbong sa pulis ang hitabo ngadto sa mga opisyal.",
        "Nagpraktis sila og Cebuano human sa klase.",
    ],
}

BART_SAMPLES = [
    ("The chef prepared fresh vegetables and soup for dinner.", "food"),
    ("We ordered rice, chicken, and dessert at the restaurant.", "food"),
    ("The athlete scored the winning point in the basketball game.", "sports"),
    ("The team trained every morning for the tournament.", "sports"),
    ("The president gave a report after the election results.", "news"),
    ("Police confirmed the incident during a public briefing.", "news"),
    ("The judge explained the legal rights of the accused person.", "laws"),
    ("Congress approved a new policy after a long debate.", "laws"),
    ("The students studied their lessons in the classroom.", "education"),
    ("The university awarded scholarships to new graduates.", "education"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT_DIR))


def round_float(value: Any, digits: int = 4) -> Any:
    if isinstance(value, float):
        return round(value, digits)
    return value


def read_csv_dicts(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv_dicts(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({name: row.get(name, "") for name in fieldnames})


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def create_lda_sample_set() -> Path:
    rows = read_csv_dicts(LDA_DATASET_PATH)
    selected: list[dict[str, str]] = []
    seen_by_label: dict[str, set[str]] = {label: set() for label in CANDIDATE_LABELS}
    counts = Counter()

    for index, row in enumerate(rows, start=1):
        label = row.get("label", "").strip()
        text = row.get("text", "").strip()
        if label not in CANDIDATE_LABELS or not text:
            continue
        if counts[label] >= 10 or text in seen_by_label[label]:
            continue
        seen_by_label[label].add(text)
        counts[label] += 1
        selected.append({
            "sample_id": f"lda_{label}_{counts[label]:02d}",
            "expected_label": label,
            "language": row.get("language", ""),
            "source": row.get("source", ""),
            "source_row": index,
            "text": text,
        })

    missing = [label for label in CANDIDATE_LABELS if counts[label] < 10]
    if missing:
        raise RuntimeError(f"Not enough unique LDA samples for: {', '.join(missing)}")

    path = SAMPLE_DIR / "lda_test_set.csv"
    write_csv_dicts(path, selected, ["sample_id", "expected_label", "language", "source", "source_row", "text"])
    return path


def create_language_sample_set() -> Path:
    rows: list[dict[str, str]] = []
    for language, samples in LANGUAGE_SAMPLES.items():
        for index, text in enumerate(samples, start=1):
            rows.append({
                "sample_id": f"lang_{language}_{index:02d}",
                "expected_language": language,
                "text": text,
            })

    path = SAMPLE_DIR / "language_detection_test_set.csv"
    write_csv_dicts(path, rows, ["sample_id", "expected_language", "text"])
    return path


def create_bart_sample_set() -> Path:
    rows = [
        {
            "sample_id": f"bart_{expected}_{index:02d}",
            "expected_label": expected,
            "text": text,
        }
        for index, (text, expected) in enumerate(BART_SAMPLES, start=1)
    ]
    path = SAMPLE_DIR / "bart_test_set.csv"
    write_csv_dicts(path, rows, ["sample_id", "expected_label", "text"])
    return path


def create_bertopic_sample_set() -> Path:
    rows: list[dict[str, str]] = []
    for model_key, config in BERTOPIC_MODELS.items():
        for index, (text, keyword, description) in enumerate(config["samples"], start=1):
            rows.append({
                "sample_id": f"{model_key}_{index:02d}",
                "model": model_key,
                "expected_keyword": keyword,
                "description": description,
                "text": text,
            })
    path = SAMPLE_DIR / "bertopic_sample_checks.csv"
    write_csv_dicts(path, rows, ["sample_id", "model", "expected_keyword", "description", "text"])
    return path


def create_sample_sets() -> dict[str, str]:
    return {
        "lda": rel(create_lda_sample_set()),
        "language": rel(create_language_sample_set()),
        "bart": rel(create_bart_sample_set()),
        "bertopic": rel(create_bertopic_sample_set()),
    }


def classification_metrics(rows: list[dict[str, Any]], expected_key: str, predicted_key: str, labels: list[str]) -> dict[str, Any]:
    total = len(rows)
    correct = sum(1 for row in rows if row[expected_key] == row[predicted_key])
    label_set = sorted(set(labels) | {row[expected_key] for row in rows} | {row[predicted_key] for row in rows})

    confusion = {label: {pred: 0 for pred in label_set} for label in label_set}
    for row in rows:
        confusion[row[expected_key]][row[predicted_key]] += 1

    per_label: dict[str, dict[str, Any]] = {}
    for label in label_set:
        tp = confusion[label][label]
        fp = sum(confusion[other][label] for other in label_set if other != label)
        fn = sum(confusion[label][other] for other in label_set if other != label)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_label[label] = {
            "support": sum(confusion[label].values()),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
        }

    return {
        "total_samples": total,
        "correct": correct,
        "accuracy": round(correct / total, 4) if total else 0.0,
        "per_label": per_label,
        "confusion_matrix": confusion,
    }


def evaluate_language_detector(sample_path: Path) -> dict[str, Any]:
    if not LANGUAGE_MODEL_PATH.exists():
        return {
            "title": "Language Detection",
            "evaluation_type": "supervised",
            "status": "skipped",
            "error": f"Missing artifact: {rel(LANGUAGE_MODEL_PATH)}",
            "sample_set": rel(sample_path),
        }

    model = joblib.load(LANGUAGE_MODEL_PATH)
    rows = read_csv_dicts(sample_path)
    results: list[dict[str, Any]] = []

    for row in rows:
        text = row["text"]
        prediction = str(model.predict([text])[0]).lower()
        score = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba([text])[0]
            classes = [str(cls).lower() for cls in model.classes_]
            if prediction in classes:
                score = float(probabilities[classes.index(prediction)])
        results.append({
            "sample_id": row["sample_id"],
            "text": text,
            "expected_language": row["expected_language"],
            "predicted_language": prediction,
            "score": round(score, 4) if score is not None else "",
            "matched": prediction == row["expected_language"],
        })

    metrics = classification_metrics(results, "expected_language", "predicted_language", ["english", "tagalog", "cebuano"])
    return {
        "title": "Language Detection",
        "evaluation_type": "supervised",
        "status": "completed",
        "sample_set": rel(sample_path),
        "artifact": rel(LANGUAGE_MODEL_PATH),
        "metrics": metrics,
        "samples": results,
    }


def evaluate_lda(sample_path: Path) -> dict[str, Any]:
    missing = [path for path in LDA_ARTIFACTS if not path.exists()]
    if missing:
        return {
            "title": "Latent Dirichlet Allocation",
            "evaluation_type": "supervised",
            "status": "skipped",
            "error": "Missing artifacts: " + ", ".join(rel(path) for path in missing),
            "sample_set": rel(sample_path),
        }

    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))
    from models.lda_model import LDAClassifier

    classifier = LDAClassifier()
    rows = read_csv_dicts(sample_path)
    results: list[dict[str, Any]] = []

    for row in rows:
        result = classifier.classify(row["text"], candidate_labels=CANDIDATE_LABELS)
        predicted = result["labels"][0]
        score = float(result["scores"][0])
        results.append({
            "sample_id": row["sample_id"],
            "text": row["text"],
            "expected_label": row["expected_label"],
            "predicted_label": predicted,
            "score": round(score, 4),
            "top_labels": "|".join(result["labels"]),
            "top_scores": "|".join(str(round(float(score), 4)) for score in result["scores"]),
            "matched": predicted == row["expected_label"],
        })

    metrics = classification_metrics(results, "expected_label", "predicted_label", CANDIDATE_LABELS)
    return {
        "title": "Latent Dirichlet Allocation",
        "evaluation_type": "supervised",
        "status": "completed",
        "sample_set": rel(sample_path),
        "artifacts": [rel(path) for path in LDA_ARTIFACTS],
        "metrics": metrics,
        "samples": results,
    }


def evaluate_bart(sample_path: Path) -> dict[str, Any]:
    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))

    rows = read_csv_dicts(sample_path)
    try:
        from models.bart_classifier import BartClassifier

        classifier = BartClassifier()
        results: list[dict[str, Any]] = []
        for row in rows:
            result = classifier.classify(row["text"], candidate_labels=CANDIDATE_LABELS)
            predicted = result["labels"][0]
            score = float(result["scores"][0])
            results.append({
                "sample_id": row["sample_id"],
                "text": row["text"],
                "expected_label": row["expected_label"],
                "predicted_label": predicted,
                "score": round(score, 4),
                "top_labels": "|".join(result["labels"]),
                "top_scores": "|".join(str(round(float(score), 4)) for score in result["scores"]),
                "matched": predicted == row["expected_label"],
            })
    except Exception as exc:
        return {
            "title": "BART-Large-MNLI",
            "evaluation_type": "supervised zero-shot sample",
            "status": "skipped",
            "error": str(exc),
            "sample_set": rel(sample_path),
            "metrics": {"total_samples": len(rows), "correct": 0, "accuracy": 0.0},
            "samples": [],
        }

    metrics = classification_metrics(results, "expected_label", "predicted_label", CANDIDATE_LABELS)
    return {
        "title": "BART-Large-MNLI",
        "evaluation_type": "supervised zero-shot sample",
        "status": "completed",
        "sample_set": rel(sample_path),
        "metrics": metrics,
        "samples": results,
    }


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def load_bertopic_docs(columns: list[str]) -> list[str]:
    rows = read_csv_dicts(BERTOPIC_DATASET_PATH)
    docs: list[str] = []
    for row in rows:
        parts = [row.get(column, "").strip() for column in columns]
        if all(parts):
            docs.append(" | ".join(parts))
    return docs


def load_topics_json(model_dir: Path) -> dict[str, Any]:
    topics_path = model_dir / "topics.json"
    if not topics_path.exists():
        raise FileNotFoundError(f"Missing topics file: {rel(topics_path)}")
    return json.loads(topics_path.read_text(encoding="utf-8"))


def extract_topic_rows(model_key: str, config: dict[str, Any], topics_data: dict[str, Any]) -> list[dict[str, Any]]:
    representations = topics_data.get("topic_representations", {})
    sizes = topics_data.get("topic_sizes", {})
    labels = topics_data.get("topic_labels", {})

    def sort_key(topic_id: str) -> int:
        try:
            return int(topic_id)
        except ValueError:
            return 10**9

    rows: list[dict[str, Any]] = []
    for topic_id in sorted(representations, key=sort_key):
        terms = representations.get(topic_id) or []
        top_terms = [str(term) for term, _ in terms]
        term_weights = [
            f"{term}:{round(float(weight), 6)}"
            for term, weight in terms
        ]
        rows.append({
            "model": model_key,
            "topic_id": int(topic_id),
            "is_outlier": topic_id == "-1",
            "name": labels.get(topic_id, "No clear topic (outlier)" if topic_id == "-1" else f"Topic {topic_id}"),
            "document_count": int(sizes.get(topic_id, 0)),
            "top_terms": ", ".join(top_terms),
            "term_weights": "; ".join(term_weights),
        })
    return rows


def topic_diversity(topic_rows: list[dict[str, Any]], top_n: int = 10) -> float:
    terms: list[str] = []
    for row in topic_rows:
        if row["is_outlier"]:
            continue
        topic_terms = [term.strip() for term in row["top_terms"].split(",") if term.strip()]
        terms.extend(topic_terms[:top_n])
    return round(len(set(terms)) / len(terms), 4) if terms else 0.0


def coherence_approximation(topic_rows: list[dict[str, Any]], docs: list[str], top_n: int = 10) -> float:
    topic_terms = [
        [term.strip() for term in row["top_terms"].split(",") if term.strip()][:top_n]
        for row in topic_rows
        if not row["is_outlier"]
    ]
    selected_terms = {term for terms in topic_terms for term in terms}
    if not selected_terms or not docs:
        return 0.0

    inverted = {term: set() for term in selected_terms}
    for index, doc in enumerate(docs):
        tokens = tokenize(doc)
        for term in tokens & selected_terms:
            inverted[term].add(index)

    total_docs = len(docs)
    scores: list[float] = []
    for terms in topic_terms:
        for first, second in combinations(terms, 2):
            first_docs = inverted.get(first, set())
            second_docs = inverted.get(second, set())
            joint = len(first_docs & second_docs)
            if not first_docs or not second_docs:
                scores.append(-1.0)
                continue
            if joint == 0:
                scores.append(-1.0)
                continue
            p_first = len(first_docs) / total_docs
            p_second = len(second_docs) / total_docs
            p_joint = joint / total_docs
            score = math.log(p_joint / (p_first * p_second)) / -math.log(p_joint)
            scores.append(score)

    return round(sum(scores) / len(scores), 4) if scores else 0.0


def predict_bertopic_samples(model_key: str, config: dict[str, Any], topics_data: dict[str, Any]) -> dict[str, Any]:
    model_dir = config["model_dir"]
    if not model_dir.exists():
        return {
            "status": "skipped",
            "error": f"Missing model directory: {rel(model_dir)}",
            "samples": [],
        }

    try:
        from bertopic import BERTopic

        model = BERTopic.load(str(model_dir))
        topic_labels = topics_data.get("topic_labels", {})
        samples: list[dict[str, Any]] = []
        for index, (text, keyword, description) in enumerate(config["samples"], start=1):
            topics, probabilities = model.transform([text])
            topic_id = int(topics[0])
            probability = 0.0
            if probabilities is not None and len(probabilities) > 0:
                raw_probability = probabilities[0]
                if hasattr(raw_probability, "__iter__") and not isinstance(raw_probability, (str, bytes)):
                    probability = float(max(raw_probability)) if len(raw_probability) else 0.0
                else:
                    probability = float(raw_probability)
            topic_name = (
                "No clear topic (outlier)"
                if topic_id == -1
                else topic_labels.get(str(topic_id), f"Topic {topic_id}")
            )
            samples.append({
                "sample_id": f"{model_key}_{index:02d}",
                "text": text,
                "description": description,
                "expected_keyword": keyword,
                "topic_id": topic_id,
                "topic_name": topic_name,
                "score": round(probability, 4),
                "keyword_matched": keyword.lower() in topic_name.lower(),
                "is_outlier": topic_id == -1,
            })
        return {"status": "completed", "samples": samples}
    except Exception as exc:
        return {"status": "skipped", "error": str(exc), "samples": []}


def evaluate_bertopic_model(model_key: str, config: dict[str, Any]) -> dict[str, Any]:
    try:
        topics_data = load_topics_json(config["model_dir"])
    except Exception as exc:
        return {
            "title": config["title"],
            "evaluation_type": "unsupervised",
            "status": "skipped",
            "error": str(exc),
            "model_dir": rel(config["model_dir"]),
        }

    topic_rows = extract_topic_rows(model_key, config, topics_data)
    write_csv_dicts(
        config["topics_csv"],
        topic_rows,
        ["model", "topic_id", "is_outlier", "name", "document_count", "top_terms", "term_weights"],
    )

    assignments = topics_data.get("topics", [])
    total_docs = len(assignments)
    outlier_count = int(topics_data.get("topic_sizes", {}).get("-1", assignments.count(-1)))
    topic_count = sum(1 for row in topic_rows if not row["is_outlier"])
    docs = load_bertopic_docs(config["columns"])
    samples = predict_bertopic_samples(model_key, config, topics_data)

    metrics = {
        "total_documents": total_docs,
        "topic_count": topic_count,
        "outlier_count": outlier_count,
        "outlier_rate": round(outlier_count / total_docs, 4) if total_docs else 0.0,
        "assigned_document_rate": round((total_docs - outlier_count) / total_docs, 4) if total_docs else 0.0,
        "topic_diversity_top_10": topic_diversity(topic_rows, top_n=10),
        "coherence_approximation_npmi": coherence_approximation(topic_rows, docs, top_n=10),
    }

    return {
        "title": config["title"],
        "evaluation_type": "unsupervised",
        "status": "completed",
        "model_dir": rel(config["model_dir"]),
        "topics_csv": rel(config["topics_csv"]),
        "metrics": metrics,
        "sample_check_status": samples["status"],
        "sample_check_error": samples.get("error"),
        "samples": samples["samples"],
    }


def write_summary(report: dict[str, Any]) -> None:
    rows: list[dict[str, Any]] = []
    for model_key, section in report["models"].items():
        metrics = section.get("metrics") or {}
        for metric, value in metrics.items():
            if isinstance(value, dict):
                continue
            rows.append({
                "model": model_key,
                "title": section.get("title", model_key),
                "evaluation_type": section.get("evaluation_type", ""),
                "status": section.get("status", ""),
                "metric": metric,
                "value": round_float(value),
            })
    write_csv_dicts(SUMMARY_PATH, rows, ["model", "title", "evaluation_type", "status", "metric", "value"])


def artifact_snapshot() -> dict[str, Any]:
    paths = [LANGUAGE_MODEL_PATH, *LDA_ARTIFACTS]
    paths.extend(config["model_dir"] / "topics.json" for config in BERTOPIC_MODELS.values())
    snapshot: dict[str, Any] = {}
    for path in paths:
        snapshot[rel(path)] = {
            "exists": path.exists(),
            "mtime": path.stat().st_mtime if path.exists() else None,
            "size": path.stat().st_size if path.exists() else None,
        }
    return snapshot


def run_evaluation(skip_bart: bool = False) -> dict[str, Any]:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    before = artifact_snapshot()
    samples = create_sample_sets()
    sample_paths = {
        "lda": ROOT_DIR / samples["lda"],
        "language": ROOT_DIR / samples["language"],
        "bart": ROOT_DIR / samples["bart"],
    }

    models: dict[str, Any] = {
        "language": evaluate_language_detector(sample_paths["language"]),
        "lda": evaluate_lda(sample_paths["lda"]),
    }

    if skip_bart:
        models["bart"] = {
            "title": "BART-Large-MNLI",
            "evaluation_type": "supervised zero-shot sample",
            "status": "skipped",
            "error": "Skipped by --skip-bart",
            "sample_set": samples["bart"],
        }
    else:
        models["bart"] = evaluate_bart(sample_paths["bart"])

    for model_key, config in BERTOPIC_MODELS.items():
        models[model_key] = evaluate_bertopic_model(model_key, config)

    after = artifact_snapshot()
    report = {
        "generated_at": now_iso(),
        "one_shot_cache": True,
        "report_path": rel(REPORT_PATH),
        "summary_csv": rel(SUMMARY_PATH),
        "sample_sets": samples,
        "artifact_guard": {
            "checked": True,
            "unchanged": before == after,
            "before": before,
            "after": after,
        },
        "models": models,
    }
    write_json(REPORT_PATH, report)
    write_summary(report)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate saved model evaluation reports once.")
    parser.add_argument("--force", action="store_true", help="Regenerate reports even when evaluation_report.json exists.")
    parser.add_argument("--skip-bart", action="store_true", help="Skip heavyweight BART zero-shot evaluation.")
    return parser.parse_args()


def main() -> int:
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    args = parse_args()

    if REPORT_PATH.exists() and not args.force:
        print(f"Evaluation report already exists: {rel(REPORT_PATH)}")
        print("Use --force to regenerate it.")
        return 0

    report = run_evaluation(skip_bart=args.skip_bart)
    print(f"Saved evaluation report: {report['report_path']}")
    print(f"Saved summary CSV: {report['summary_csv']}")
    print(f"Model artifacts unchanged: {report['artifact_guard']['unchanged']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
