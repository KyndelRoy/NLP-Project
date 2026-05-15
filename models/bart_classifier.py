from transformers import pipeline


class BartClassifier:
    def __init__(self, model_path="facebook/bart-large-mnli"):
        print(f"Loading BART model ({model_path})...")
        self.classifier = pipeline("zero-shot-classification", model=model_path)
        print("BART model loaded!")

    def classify(self, text, candidate_labels):
        # Multi-label mode lets multiple candidate topics appear for one text.
        result = self.classifier(text, candidate_labels=candidate_labels, multi_label=True)

        present_topics = []
        for label, score in zip(result['labels'], result['scores']):
            if score > 0.5:
                present_topics.append({"label": label, "score": score})

        # If no topic has a score > 0.5, return the top 1 topic
        if not present_topics:
            present_topics.append({"label": result['labels'][0], "score": result['scores'][0]})

        # Limit to up to 3 topics
        present_topics = present_topics[:3]

        return {
            "labels": [t["label"] for t in present_topics],
            "scores": [t["score"] for t in present_topics]
        }
