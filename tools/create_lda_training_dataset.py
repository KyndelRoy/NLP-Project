import csv
import os
import re
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_PATH = ROOT_DIR.parent / "topical_corpus.csv"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "dataset" / "lda_training_dataset.csv"
ROWS_PER_LABEL = 150
MAX_TEXT_CHARS = 1200

LABEL_KEYWORDS = {
    "food": [
        "pagkain", "kain", "kumain", "ulam", "kanin", "luto", "lutong",
        "adobo", "sinigang", "restaurant", "kusina", "hapunan",
    ],
    "sports": [
        "laro", "palaro", "basketbol", "basketball", "football", "soccer",
        "boksing", "koponan", "manlalaro", "atleta", "kampeon",
    ],
    "news": [
        "balita", "ulat", "gobyerno", "pangulo", "pulis", "pulisya",
        "halalan", "maynila", "senado", "kongreso", "bagyo",
    ],
    "laws": [
        "batas", "korte", "karapatan", "abogado", "hukom", "hatol",
        "legal", "katarungan", "konstitusyon", "ordinansa", "parusa",
    ],
    "education": [
        "paaralan", "eskwela", "guro", "mag-aaral", "estudyante",
        "pamantasan", "unibersidad", "kolehiyo", "aralin", "pagsusulit",
    ],
}


def normalize_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def excerpt_text(text, max_chars=MAX_TEXT_CHARS):
    text = normalize_text(text)
    if len(text) <= max_chars:
        return text

    excerpt = text[:max_chars].rsplit(" ", 1)[0]
    return excerpt.strip()


def keyword_score(text, keywords):
    score = 0
    for keyword in keywords:
        score += len(re.findall(rf"\b{re.escape(keyword)}\b", text))
    return score


def build_balanced_dataset(source_path, output_path, rows_per_label=ROWS_PER_LABEL):
    df = pd.read_csv(source_path)
    required = {"text", "source", "language"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Source corpus is missing columns: {sorted(missing)}")

    used_indexes = set()
    selected_rows = []

    for label, keywords in LABEL_KEYWORDS.items():
        candidates = []
        for idx, row in df.iterrows():
            if idx in used_indexes:
                continue

            text = normalize_text(row["text"])
            if len(text) < 80:
                continue

            score = keyword_score(text, keywords)
            if score <= 0:
                continue

            candidates.append((score, len(text), idx, row))

        candidates.sort(key=lambda item: (-item[0], item[1]))
        if len(candidates) < rows_per_label:
            raise ValueError(
                f"Only found {len(candidates)} rows for {label}; "
                f"need {rows_per_label}."
            )

        for _, _, idx, row in candidates[:rows_per_label]:
            used_indexes.add(idx)
            selected_rows.append(
                {
                    "label": label,
                    "language": row["language"],
                    "source": row["source"],
                    "text": excerpt_text(row["text"]),
                }
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["label", "language", "source", "text"])
        writer.writeheader()
        writer.writerows(selected_rows)

    return selected_rows


if __name__ == "__main__":
    source = Path(os.environ.get("LDA_SOURCE_CORPUS", DEFAULT_SOURCE_PATH))
    output = Path(os.environ.get("LDA_OUTPUT_DATASET", DEFAULT_OUTPUT_PATH))
    rows = build_balanced_dataset(source, output)
    print(f"Wrote {len(rows)} rows to {output}")
