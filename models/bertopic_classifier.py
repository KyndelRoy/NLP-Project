"""BERTopic classifier wrapper for the FastAPI server."""

import sys
import os

# Add bertopic_classifier directory to path so we can import base.py
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bertopic_classifier'))

from base import load_or_train, predict_topic


class BertopicClassifier:
    def __init__(self, config: dict):
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
        bertopic_dir = os.path.join(base_dir, 'bertopic_classifier')

        model_dir = os.path.join(bertopic_dir, config["model_dir"])
        dataset_path = os.path.join(bertopic_dir, config["dataset"])
        stopwords_path = os.path.join(bertopic_dir, config["stopwords"]) if config.get("stopwords") else None

        print(f"Loading BERTopic model: {config['name']}...")
        self.model = load_or_train(
            model_dir=model_dir,
            dataset_path=dataset_path,
            columns=config["columns"],
            embedding_model_name=config["embedding_model"],
            stopwords_path=stopwords_path,
        )
        print(f"BERTopic model ready: {config['name']}")

    def classify(self, text: str) -> dict:
        name, topic_id, prob = predict_topic(self.model, text)

        # Clean up the topic name (remove the "0_word1_word2" prefix format)
        clean_name = name
        parts = name.split("_")
        if len(parts) > 1 and parts[0].lstrip("-").isdigit():
            clean_name = " ".join(parts[1:]).title()

        return {
            "label": clean_name,
            "score": prob,
            "topic_id": topic_id,
            "raw_name": name,
        }
