#!/usr/bin/env python3
"""English+Tagalog pair BERTopic: extract topics from parallel pairs and predict."""

from base import load_or_train, print_topics, interactive_loop

DATASET = "bertopic_dataset.csv"
MODEL_DIR = "models/topic_english_tagalog"
STOPWORDS_FILE = "filipino_stopwords.txt"
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
COLUMNS = ["english", "tagalog"]


def main():
    model = load_or_train(MODEL_DIR, DATASET, COLUMNS, EMBEDDING_MODEL, STOPWORDS_FILE)
    print_topics(model)
    interactive_loop(model, "Enter English or Tagalog text to predict topic")


if __name__ == "__main__":
    main()
