# Multilingual Topic Classifier

Topic classification and language detection for English, Tagalog, and Cebuano.


## Setup

### 1. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Train the language detection model

```bash
python models/language_detector.py
```

The compatibility command `python models/language.detect.py` also works.

This saves `language_identifer.pkl` in `models/pkl/`.

### 4. Train the LDA topic model

The repo includes a small balanced LDA training set at
`dataset/lda_training_dataset.csv`, derived from the larger local corpus with
`tools/create_lda_training_dataset.py`.

```bash
python models/lda_model.py
```

This saves `lda_vectorizer.pkl` and `lda_model.pkl` in `models/pkl/`.

### 5. Start the server

```bash
python models/server.py
```

On first run, the server will automatically train and save the 3 BERTopic models. This takes a few minutes. Subsequent starts load from cache instantly.

The server runs at `http://127.0.0.1:8000`.

### 5. Open the frontend

Open `index.html` in a browser. The backend must be running.

## Available Models

| Dropdown Option | Model | Key |
|----------------|-------|-----|
| BART-Large-MNLI | Zero-shot classification | `bart` |
| BERTopic (English) | English-only topic model | `bertopic_en` |
| BERTopic (EN + TL) | English + Tagalog topic model | `bertopic_en_tl` |
| BERTopic (Trilingual) | EN + TL + Cebuano topic model | `bertopic_tri` |
| LDA Topic Model | Lightweight LDA baseline trained from `dataset/lda_training_dataset.csv` | `lda` |
| Language Detection | Logistic Regression language detector | `language` |

## Additional Documentation

See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for architecture, model lifecycle, API reference, development workflow, and quality checks.
