import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import joblib
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PKL_DIR = os.path.join(BASE_DIR, 'pkl')
VECTORIZER_PATH = os.path.join(PKL_DIR, 'lda_vectorizer.pkl')
LDA_MODEL_PATH = os.path.join(PKL_DIR, 'lda_model.pkl')
LDA_METADATA_PATH = os.path.join(PKL_DIR, 'lda_metadata.pkl')
DEFAULT_DATASET_PATH = os.path.join(BASE_DIR, '..', 'dataset', 'lda_training_dataset.csv')
DEFAULT_STOPWORDS_PATH = os.path.join(BASE_DIR, '..', 'dataset', 'filipino_stopwords.txt')
DEFAULT_N_COMPONENTS = 20

# ---------------------------------------------------------------------------
# Seed keywords for each candidate label.
# Includes English, Tagalog, and Cebuano terms so the mapping works across
# all three languages the corpus covers.
# ---------------------------------------------------------------------------
SEED_KEYWORDS = {
    "food": [
        # English
        "food", "eat", "meal", "recipe", "restaurant", "hungry", "cook",
        "drink", "diet", "nutrition", "ingredient", "delicious", "taste",
        # Tagalog
        "kain", "pagkain", "gutom", "lutuin", "luto", "masarap", "ulam",
        "kanin", "hapunan", "almusal", "tanghalian", "kusina", "nilaga",
        "adobo", "sinigang",
        # Cebuano
        "kaon", "pagkaon", "gutom", "luto", "sud-an", "kan-on", "panihapon",
        "pamahaw", "paniudto",
    ],
    "sports": [
        # English
        "sports", "game", "player", "team", "win", "champion", "tournament",
        "basketball", "soccer", "football", "volleyball", "boxing", "race",
        "athlete", "coach", "training", "score", "league", "olympic",
        # Tagalog
        "laro", "palaro", "atleta", "manlalaro", "koponan", "kampeon",
        "basketbol", "suntukan", "takbo",
        # Cebuano
        "dula", "magdudula", "campeon", "basketbol",
    ],
    "news": [
        # English
        "news", "report", "incident", "government", "president", "election",
        "police", "crime", "breaking", "headline", "event", "mayor", "senator",
        # Tagalog
        "balita", "ulat", "nangyari", "gobyerno", "pangulo", "pulisya",
        "krimen", "halalan", "pilipinas", "manila", "probinsya",
        # Cebuano
        "balita", "gobyerno", "presidente", "pulis", "krimen", "pilipinas",
        "cebu", "davao",
    ],
    "laws": [
        # English
        "law", "legal", "court", "rights", "constitution", "congress",
        "senate", "ordinance", "policy", "regulation", "justice", "attorney",
        "judge", "verdict", "case", "penalty", "supreme", "act", "bill",
        # Tagalog
        "batas", "korte", "karapatan", "kongreso", "senado", "katarungan",
        "abogado", "hukom", "hatol", "parusahan", "patakaran",
        # Cebuano
        "balaod", "korte", "katungod", "kongreso", "senado", "hustisya",
        "abogado", "huwes",
    ],
    "education": [
        # English
        "school", "student", "teacher", "learn", "study", "education",
        "university", "college", "grade", "curriculum", "classroom",
        "graduate", "scholarship", "subject", "diploma", "exam", "lesson",
        # Tagalog
        "paaralan", "guro", "mag-aaral", "aral", "eskwela", "kolehiyo",
        "pamantasan", "diploma", "kurso", "klase", "aralin",
        # Cebuano
        "eskwelahan", "maestro", "estudyante", "pagtuon", "kolehiyo",
        "unibersidad",
    ],
}


def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return text


def load_stopwords(stopwords_path):
    stopwords = set()
    with open(stopwords_path, 'r', encoding='utf-8') as f:
        for line in f:
            cleaned = preprocess_text(line.strip())
            if not cleaned:
                continue
            stopwords.add(cleaned)
            stopwords.update(re.split(r'[\s-]+', cleaned))
    return sorted(set(stopwords))


def map_topics_to_labels(lda_model, vectorizer, candidate_labels):
    """
    For each LDA topic, score it against every candidate label's seed keywords
    using the topic's word-weight distribution (lda.components_). The label
    with the highest cumulative seed-word weight wins that topic.

    Returns a dict: { topic_index (int) -> label (str) }
    """
    feature_names = vectorizer.get_feature_names_out()
    # Build a fast lookup: word -> its index in the vocabulary
    vocab_index = {word: i for i, word in enumerate(feature_names)}

    topic_label_map = {}
    for topic_idx, topic_weights in enumerate(lda_model.components_):
        best_label = candidate_labels[0]
        best_score = -1.0
        for label in candidate_labels:
            seeds = SEED_KEYWORDS.get(label, [])
            # Sum the LDA weight of every seed word that exists in vocabulary
            score = sum(
                topic_weights[vocab_index[w]]
                for w in seeds
                if w in vocab_index
            )
            if score > best_score:
                best_score = score
                best_label = label
        topic_label_map[topic_idx] = best_label

    return topic_label_map


def build_topic_label_map_from_training_data(lda_model, document_topic_matrix, labels):
    topic_label_scores = {
        topic_idx: {}
        for topic_idx in range(lda_model.n_components)
    }

    for topic_distribution, label in zip(document_topic_matrix, labels):
        for topic_idx, probability in enumerate(topic_distribution):
            topic_label_scores[topic_idx][label] = (
                topic_label_scores[topic_idx].get(label, 0.0) + float(probability)
            )

    topic_label_map = {}
    for topic_idx, label_scores in topic_label_scores.items():
        topic_label_map[topic_idx] = max(label_scores.items(), key=lambda item: item[1])[0]

    return topic_label_map


def train_lda(dataset_path, stopwords_path, n_components=10):
    print("Loading stopwords...")
    stopwords = load_stopwords(stopwords_path)

    print("Loading dataset...")
    df = pd.read_csv(dataset_path)
    if 'text' not in df.columns:
        raise ValueError("Dataset must contain a 'text' column.")
    if 'label' not in df.columns:
        raise ValueError("Dataset must contain a 'label' column.")

    print("Preprocessing text...")
    df['clean_text'] = df['text'].apply(preprocess_text)
    df = df[df['clean_text'].astype(bool)].copy()
    texts = df['clean_text'].tolist()
    if not texts:
        raise ValueError("No usable text rows found after preprocessing.")

    print("Vectorizing...")
    vectorizer = CountVectorizer(stop_words=stopwords, max_features=5000, ngram_range=(1, 2))
    X = vectorizer.fit_transform(texts)

    print("Training LDA model...")
    lda = LatentDirichletAllocation(n_components=n_components, random_state=42, n_jobs=-1)
    lda.fit(X)
    topic_label_map = build_topic_label_map_from_training_data(
        lda,
        lda.transform(X),
        df['label'].tolist(),
    )

    print("Saving model and vectorizer...")
    os.makedirs(PKL_DIR, exist_ok=True)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(lda, LDA_MODEL_PATH)
    joblib.dump(
        {
            "topic_label_map": topic_label_map,
            "candidate_labels": sorted(df['label'].unique().tolist()),
            "dataset_path": os.path.abspath(dataset_path),
        },
        LDA_METADATA_PATH,
    )
    print("Training complete!")


class LDAClassifier:
    def __init__(self, verbose=False):
        missing_artifacts = [
            path for path in (VECTORIZER_PATH, LDA_MODEL_PATH, LDA_METADATA_PATH)
            if not os.path.exists(path)
        ]
        if missing_artifacts:
            print("LDA artifacts missing. Training from the default dataset...")
            train_lda(
                DEFAULT_DATASET_PATH,
                DEFAULT_STOPWORDS_PATH,
                n_components=DEFAULT_N_COMPONENTS,
            )

        self.vectorizer = joblib.load(VECTORIZER_PATH)
        self.lda = joblib.load(LDA_MODEL_PATH)
        metadata = joblib.load(LDA_METADATA_PATH) if os.path.exists(LDA_METADATA_PATH) else {}

        # Build topic -> candidate label mapping at load time.
        # Uses the candidate labels defined in config; fall back to a default
        # set if config is unavailable.
        try:
            from config import CANDIDATE_LABELS
            candidate_labels = CANDIDATE_LABELS
        except ImportError:
            candidate_labels = ["food", "sports", "news", "laws", "education"]

        self.topic_label_map = metadata.get("topic_label_map") or map_topics_to_labels(
            self.lda, self.vectorizer, candidate_labels
        )
        self.candidate_labels = metadata.get("candidate_labels") or candidate_labels

        if verbose:
            print("LDA topic -> label mapping:")
            feature_names = self.vectorizer.get_feature_names_out()
            for topic_idx, label in self.topic_label_map.items():
                top_words = self.lda.components_[topic_idx].argsort()[-5:][::-1]
                words = ", ".join(feature_names[i] for i in top_words)
                print(f"  Topic {topic_idx:2d} -> '{label}'  (top words: {words})")

    def classify(self, text, candidate_labels=None):
        clean = preprocess_text(text)
        X = self.vectorizer.transform([clean])
        topic_distribution = self.lda.transform(X)[0]

        # Aggregate topic probabilities by their mapped candidate label.
        # Multiple topics can map to the same label; their scores are summed.
        active_labels = candidate_labels or self.candidate_labels
        label_scores = {label: 0.0 for label in active_labels}
        for topic_idx, prob in enumerate(topic_distribution):
            label = self.topic_label_map[topic_idx]
            if label in label_scores:
                label_scores[label] += float(prob)

        # Normalize so scores sum to 1.0
        total = sum(label_scores.values())
        if total > 0:
            label_scores = {k: v / total for k, v in label_scores.items()}

        # Sort descending and return top 3
        sorted_labels = sorted(label_scores.items(), key=lambda x: x[1], reverse=True)
        top_labels = [k for k, _ in sorted_labels[:3]]
        top_scores = [v for _, v in sorted_labels[:3]]

        return {
            "labels": top_labels,
            "scores": top_scores,
        }


if __name__ == "__main__":
    train_lda(DEFAULT_DATASET_PATH, DEFAULT_STOPWORDS_PATH, n_components=DEFAULT_N_COMPONENTS)
