#!/usr/bin/env python3
"""English-only BERTopic: extract topics from English column and predict."""

import csv
from pathlib import Path
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer

DATASET = "bertopic_dataset.csv"
MODEL_DIR = "models/topic_english"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"


def load_english_docs(path: str) -> list[str]:
    docs = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row["english"].strip()
            if text:
                docs.append(text)
    return docs


def train_model(docs: list[str]) -> BERTopic:
    embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    model = BERTopic(embedding_model=embedding_model, verbose=True)
    model.fit(docs)
    return model


def print_topics(model: BERTopic):
    info = model.get_topic_info()
    topic_count = len(info[info["Topic"] != -1])
    outlier_count = int(info[info["Topic"] == -1]["Count"].iloc[0]) if -1 in info["Topic"].values else 0
    print(f"\n{'='*60}")
    print(f"Discovered {topic_count} topics ({outlier_count} outlier docs)")
    print(f"{'='*60}")
    for _, row in info.iterrows():
        if row["Topic"] == -1:
            continue
        print(f"  Topic {row['Topic']}: {row['Name']} ({row['Count']})")
    print()


def predict_topic(model: BERTopic, text: str) -> tuple[str, int]:
    topics, _ = model.transform([text])
    topic_id = topics[0]
    if topic_id == -1:
        return "No clear topic (outlier)", -1
    info = model.get_topic_info()
    match = info[info["Topic"] == topic_id]
    name = match.iloc[0]["Name"] if not match.empty else f"Topic {topic_id}"
    return name, topic_id


def main():
    model_path = Path(MODEL_DIR)

    if model_path.exists():
        print("Loading saved model...")
        model = BERTopic.load(MODEL_DIR)
    else:
        print("Loading dataset...")
        docs = load_english_docs(DATASET)
        print(f"Loaded {len(docs)} English documents")
        print("Training BERTopic model (this may take a minute)...")
        model = train_model(docs)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        model.save(MODEL_DIR, serialization="safetensors", save_ctfidf=True, save_embedding_model=EMBEDDING_MODEL)
        print(f"Model saved to {MODEL_DIR}")

    print_topics(model)

    print("Enter English text to predict topic (type 'quit' to exit):")
    while True:
        try:
            text = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if text.lower() == "quit":
            break
        if not text:
            continue
        name, topic_id = predict_topic(model, text)
        print(f"Topic: {name}")


if __name__ == "__main__":
    main()
