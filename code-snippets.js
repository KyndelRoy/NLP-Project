window.CODE_SNIPPETS = {
    bart: {
        title: 'BART-Large-MNLI Code',
        code: `# BART-Large-MNLI is used for zero-shot topic classification.
# It compares the input text against candidate topic labels without retraining.
from transformers import pipeline

class BartClassifier:
    def __init__(self, model_path="facebook/bart-large-mnli"):
        print(f"Loading BART model ({model_path})...")

        # Hugging Face pipeline handles tokenization, model inference, and scoring.
        self.classifier = pipeline("zero-shot-classification", model=model_path)
        print("BART model loaded!")

    def classify(self, text, candidate_labels):
        # multi_label=True allows more than one topic to be returned for one text.
        result = self.classifier(text, candidate_labels=candidate_labels, multi_label=True)

        # Keep topics that pass the confidence threshold.
        present_topics = []
        for label, score in zip(result['labels'], result['scores']):
            if score > 0.5:
                present_topics.append({"label": label, "score": score})

        # If every score is low, still return the strongest topic.
        if not present_topics:
            present_topics.append({"label": result['labels'][0], "score": result['scores'][0]})

        # Limit output to the top three topics for a cleaner presentation.
        present_topics = present_topics[:3]

        return {
            "labels": [t["label"] for t in present_topics],
            "scores": [t["score"] for t in present_topics]
        }`
    },
    specialized: {
        title: 'Latent Dirichlet Allocation Code',
        code: `# LDA model placeholder for presentation
# lda_model.py is currently empty in this project.

# Intended implementation outline:
# 1. Clean and tokenize training text.
# 2. Vectorize tokens with CountVectorizer.
# 3. Fit sklearn.decomposition.LatentDirichletAllocation.
# 4. Transform input text into topic probabilities.
# 5. Return the highest-scoring topic and confidence.`
    },
    fast: {
        title: 'BERTopic Code',
        code: `# BERTopic model placeholder for presentation
# BERTopic is listed in the UI but is not initialized in models/server.py yet.

# Intended implementation outline:
# 1. Load or train a BERTopic model.
# 2. Run topic_model.transform([text]).
# 3. Map the predicted topic id to a readable label.
# 4. Return the label and probability score.`
    },
    language: {
        title: 'Language Detection Code',
        code: `# Logistic Regression language detector.
# The model learns character patterns for Cebuano, Tagalog, English, and Other.
import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Locate and load the multilingual dataset.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'extended_dataset.csv')
df = pd.read_csv(csv_path)

# Convert language columns into one training table: text + language label.
df_reshaped = pd.melt(
    df,
    value_vars=['cebuano', 'tagalog', 'english', 'other'],
    var_name='language',
    value_name='text'
).dropna()

# Split examples so the model can be trained and evaluated separately.
X_train, X_test, y_train, y_test = train_test_split(
    df_reshaped['text'],
    df_reshaped['language'],
    test_size=0.15,
    random_state=42
)

# Character-level TF-IDF works well for short multilingual text.
# Logistic Regression then learns which character patterns indicate each language.
model = Pipeline([
    ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(1, 3))),
    ('clf', LogisticRegression(max_iter=1000))
])

# Train the detector.
model.fit(X_train, y_train)

# Save the trained pipeline so the FastAPI server can load it later.
model_dir = os.path.join(BASE_DIR, 'pkl')
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'language_identifer.pkl')
joblib.dump(model, model_path)`
    }
};
