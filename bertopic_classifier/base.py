"""Shared BERTopic utilities used by all three model scripts."""

import csv
from pathlib import Path
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import CountVectorizer


def load_stopwords(path: str) -> list[str]:
    """Load stopwords from a text file, one per line."""
    words = []
    p = Path(path)
    if not p.exists():
        return words
    with open(p, "r", encoding="utf-8") as f:
        for line in f:
            w = line.strip().lower()
            if w and not w.startswith("#"):
                words.append(w)
    return words


def load_docs(csv_path: str, columns: list[str]) -> list[str]:
    """Load documents by joining specified columns with ' | '."""
    docs = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Joining parallel translations gives multilingual models aligned context.
            parts = [row[col].strip() for col in columns]
            if all(parts):
                docs.append(" | ".join(parts))
    return docs


def train_model(docs: list[str], embedding_model_name: str, stopwords: list[str] = None) -> BERTopic:
    """Train a BERTopic model on the given documents."""
    embedding_model = SentenceTransformer(embedding_model_name)
    vectorizer = CountVectorizer(stop_words=stopwords if stopwords else None)
    model = BERTopic(
        embedding_model=embedding_model,
        vectorizer_model=vectorizer,
        verbose=True,
    )
    model.fit(docs)
    return model


def load_or_train(
    model_dir: str,
    dataset_path: str,
    columns: list[str],
    embedding_model_name: str,
    stopwords_path: str = None,
) -> BERTopic:
    """Load a saved model or train a new one if none exists."""
    model_path = Path(model_dir)

    if model_path.exists():
        # Saved BERTopic directories are reused to avoid retraining on each startup.
        print(f"Loading saved model from {model_dir}...")
        return BERTopic.load(model_dir)

    print(f"Loading dataset from {dataset_path}...")
    docs = load_docs(dataset_path, columns)
    print(f"Loaded {len(docs)} documents (columns: {', '.join(columns)})")

    stopwords = load_stopwords(stopwords_path) if stopwords_path else []
    if stopwords:
        print(f"Loaded {len(stopwords)} stopwords")

    print("Training BERTopic model (this may take a few minutes)...")
    model = train_model(docs, embedding_model_name, stopwords)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(model_dir, serialization="safetensors", save_ctfidf=True, save_embedding_model=embedding_model_name)
    print(f"Model saved to {model_dir}")

    return model


def predict_topic(model: BERTopic, text: str) -> tuple[str, int, float]:
    """Predict topic for a single text. Returns (name, topic_id, probability)."""
    topics, probs = model.transform([text])
    topic_id = topics[0]
    prob = float(probs[0]) if probs is not None and len(probs) > 0 else 0.0

    if topic_id == -1:
        return "No clear topic (outlier)", -1, prob

    info = model.get_topic_info()
    match = info[info["Topic"] == topic_id]
    name = match.iloc[0]["Name"] if not match.empty else f"Topic {topic_id}"
    return name, topic_id, prob


def print_topics(model: BERTopic):
    """Display all discovered topics."""
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


def interactive_loop(model: BERTopic, prompt: str = "Enter text to predict topic"):
    """Run an interactive prediction loop in the terminal."""
    print(f"{prompt} (type 'quit' to exit):")
    while True:
        try:
            text = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if text.lower() == "quit":
            break
        if not text:
            continue
        name, topic_id, prob = predict_topic(model, text)
        print(f"Topic: {name}")
