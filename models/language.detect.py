import pandas as pd

import os
# Load the long-format language detection dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'language_detection_dataset.csv')
df_reshaped = pd.read_csv(csv_path).dropna()

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# 1. Split the reshaped data
X_train, X_test, y_train, y_test = train_test_split(
    df_reshaped['text'], df_reshaped['language'], test_size=0.15, random_state=42
)

# 2. Build a pipeline with a Character-level Vectorizer
# 'char' is better than 'word' for distinguishing Tagalog vs Cebuano
model = Pipeline([
    ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(1, 3))),
    ('clf', LogisticRegression(max_iter=1000))
])

# 3. Train
model.fit(X_train, y_train)

# 4. Save the model
import joblib
model_dir = os.path.join(BASE_DIR, 'pkl')
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'language_identifer.pkl')
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
