window.CODE_SNIPPETS = {
    bart: {
        title: 'BART-Large-MNLI Code',
        code: `# Zero-shot topic classification using BART-Large-MNLI.
# Compares input text against candidate labels without retraining.
from transformers import pipeline

class BartClassifier:
    def __init__(self, model_path="facebook/bart-large-mnli"):
        self.classifier = pipeline("zero-shot-classification", model=model_path)

    def classify(self, text, candidate_labels):
        result = self.classifier(text, candidate_labels=candidate_labels, multi_label=True)

        present_topics = []
        for label, score in zip(result['labels'], result['scores']):
            if score > 0.5:
                present_topics.append({"label": label, "score": score})

        if not present_topics:
            present_topics.append({"label": result['labels'][0], "score": result['scores'][0]})

        return {
            "labels": [t["label"] for t in present_topics[:3]],
            "scores": [t["score"] for t in present_topics[:3]]
        }`
    },
    lda: {
        title: 'Latent Dirichlet Allocation Code',
        code: `# Lightweight LDA baseline trained from dataset/lda_training_dataset.csv.
from models.lda_model import LDAClassifier, train_lda

train_lda(
    "dataset/lda_training_dataset.csv",
    "dataset/filipino_stopwords.txt",
    n_components=20,
)

classifier = LDAClassifier()
result = classifier.classify("Nag-aaral ang estudyante sa paaralan.")`
    },
    bertopic_en: {
        title: 'BERTopic (English) Code',
        code: `# BERTopic English-only model.
# Trains on the English column using all-MiniLM-L6-v2 embeddings.
from base import load_or_train, predict_topic

DATASET = "bertopic_dataset.csv"
MODEL_DIR = "models/topic_english"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
COLUMNS = ["english"]

model = load_or_train(MODEL_DIR, DATASET, COLUMNS, EMBEDDING_MODEL)
name, topic_id, prob = predict_topic(model, "i want to cook chicken")`
    },
    bertopic_en_tl: {
        title: 'BERTopic (EN + TL) Code',
        code: `# BERTopic English + Tagalog model.
# Trains on concatenated EN|TL pairs using multilingual embeddings.
from base import load_or_train, predict_topic

DATASET = "bertopic_dataset.csv"
MODEL_DIR = "models/topic_english_tagalog"
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
COLUMNS = ["english", "tagalog"]

model = load_or_train(MODEL_DIR, DATASET, COLUMNS, EMBEDDING_MODEL, "filipino_stopwords.txt")
name, topic_id, prob = predict_topic(model, "gusto kong kumain ng manok")`
    },
    bertopic_tri: {
        title: 'BERTopic (Trilingual) Code',
        code: `# BERTopic Trilingual model (English + Tagalog + Cebuano).
# Trains on concatenated EN|TL|CB triplets using multilingual embeddings.
from base import load_or_train, predict_topic

DATASET = "bertopic_dataset.csv"
MODEL_DIR = "models/topic_trilingual"
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
COLUMNS = ["english", "tagalog", "cebuano"]

model = load_or_train(MODEL_DIR, DATASET, COLUMNS, EMBEDDING_MODEL, "filipino_stopwords.txt")
name, topic_id, prob = predict_topic(model, "ganahan ko magluto og manok")`
    },
    language: {
        title: 'Language Detection Code',
        code: `# Logistic Regression language detector.
# Character-level TF-IDF for Cebuano, Tagalog, English, and Other.
import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'language_detection_dataset.csv')
df_reshaped = pd.read_csv(csv_path).dropna()

X_train, X_test, y_train, y_test = train_test_split(
    df_reshaped['text'],
    df_reshaped['language'],
    test_size=0.15,
    random_state=42
)

model = Pipeline([
    ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(1, 3))),
    ('clf', LogisticRegression(max_iter=1000))
])

model.fit(X_train, y_train)

model_dir = os.path.join(BASE_DIR, 'pkl')
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'language_identifer.pkl')
joblib.dump(model, model_path)`
    }
};
