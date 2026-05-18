// Metadata for the View Code modal; file-backed tabs load source at runtime.
window.CODE_SNIPPETS = {
    bart: {
        title: 'BART-Large-MNLI Code',
        tabs: [
            { key: 'classifier', label: 'Classifier', title: 'bart_classifier.py', source: 'models/bart_classifier.py' },
            { key: 'server', label: 'API Route', title: 'server.py', source: 'models/server.py' },
            { key: 'config', label: 'Config', title: 'config.py', source: 'models/config.py' }
        ],
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
        tabs: [
            { key: 'model', label: 'Model Script', title: 'lda_model.py', source: 'models/lda_model.py' },
            { key: 'server', label: 'API Route', title: 'server.py', source: 'models/server.py' },
            { key: 'config', label: 'Config', title: 'config.py', source: 'models/config.py' }
        ],
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
        tabs: [
            { key: 'model', label: 'Model Script', title: 'topic_english.py', source: 'bertopic_classifier/topic_english.py' },
            { key: 'base', label: 'Load + Predict', title: 'base.py', source: 'bertopic_classifier/base.py' },
            { key: 'wrapper', label: 'Server Wrapper', title: 'bertopic_model.py', source: 'models/bertopic_model.py' },
            { key: 'server', label: 'API Route', title: 'server.py', source: 'models/server.py' },
            { key: 'config', label: 'Config', title: 'config.py', source: 'models/config.py' }
        ],
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
        tabs: [
            { key: 'model', label: 'Model Script', title: 'topic_english_tagalog.py', source: 'bertopic_classifier/topic_english_tagalog.py' },
            { key: 'base', label: 'Load + Predict', title: 'base.py', source: 'bertopic_classifier/base.py' },
            { key: 'wrapper', label: 'Server Wrapper', title: 'bertopic_model.py', source: 'models/bertopic_model.py' },
            { key: 'server', label: 'API Route', title: 'server.py', source: 'models/server.py' },
            { key: 'config', label: 'Config', title: 'config.py', source: 'models/config.py' }
        ],
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
        tabs: [
            { key: 'model', label: 'Model Script', title: 'topic_trilingual.py', source: 'bertopic_classifier/topic_trilingual.py' },
            { key: 'base', label: 'Load + Predict', title: 'base.py', source: 'bertopic_classifier/base.py' },
            { key: 'wrapper', label: 'Server Wrapper', title: 'bertopic_model.py', source: 'models/bertopic_model.py' },
            { key: 'server', label: 'API Route', title: 'server.py', source: 'models/server.py' },
            { key: 'config', label: 'Config', title: 'config.py', source: 'models/config.py' }
        ],
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
        tabs: [
            { key: 'training', label: 'Training', title: 'language_detector.py', source: 'models/language_detector.py' },
            { key: 'server', label: 'API Route', title: 'server.py', source: 'models/server.py' },
            { key: 'config', label: 'Config', title: 'config.py', source: 'models/config.py' }
        ],
        code: `# Logistic Regression language detector.
# Character-level TF-IDF for Cebuano, Tagalog, English, and Other.
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

df = pd.read_csv("dataset/language_detection_dataset.csv").dropna()
model = Pipeline([
    ("tfidf", TfidfVectorizer(analyzer="char", ngram_range=(1, 3))),
    ("clf", LogisticRegression(max_iter=1000)),
])
model.fit(df["text"], df["language"])`
    }
};

window.TOOL_SNIPPETS = {
    translate_data: {
        label: 'Translate',
        title: 'translate_data.py',
        source: 'tools/translate_data.py'
    },
    create_language_detection_dataset: {
        label: 'Language Dataset',
        title: 'create_language_detection_dataset.py',
        source: 'tools/create_language_detection_dataset.py'
    },
    clean_dataset: {
        label: 'Clean Dataset',
        title: 'clean_dataset.py',
        source: 'tools/clean_dataset.py'
    },
    deep_cleaner: {
        label: 'Deep Cleaner',
        title: 'deep_cleaner.py',
        source: 'tools/deep_cleaner.py'
    }
};
