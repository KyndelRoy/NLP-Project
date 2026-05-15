import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'language_detection_dataset.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'pkl')
MODEL_PATH = os.path.join(MODEL_DIR, 'language_identifer.pkl')


def train_language_detector(csv_path=DATASET_PATH, model_path=MODEL_PATH):
    df_reshaped = pd.read_csv(csv_path).dropna()

    X_train, _, y_train, _ = train_test_split(
        df_reshaped['text'],
        df_reshaped['language'],
        test_size=0.15,
        random_state=42,
    )

    model = Pipeline([
        ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(1, 3))),
        ('clf', LogisticRegression(max_iter=1000)),
    ])
    model.fit(X_train, y_train)

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    return model_path


if __name__ == "__main__":
    saved_model_path = train_language_detector()
    print(f"Model saved to {saved_model_path}")
