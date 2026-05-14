#!/usr/bin/env python3
"""English-only BERTopic: extract topics from English column and predict."""

from base import load_or_train, print_topics, interactive_loop

DATASET = "bertopic_dataset.csv"
MODEL_DIR = "models/topic_english"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
COLUMNS = ["english"]


def main():
    model = load_or_train(MODEL_DIR, DATASET, COLUMNS, EMBEDDING_MODEL)
    print_topics(model)
    interactive_loop(model, "Enter English text to predict topic")


if __name__ == "__main__":
    main()
