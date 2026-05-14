# Multilingual Topic Classifier

Topic classification and language detection for English, Tagalog, and Cebuano.

## Project Structure

```
ml2/
├── index.html                  # Frontend UI
├── style.css
├── script.js
├── code-snippets.js
├── dataset-previews.js
├── requirements.txt
│
├── models/                     # Backend
│   ├── server.py               # FastAPI server (main entry point)
│   ├── config.py               # Model configs and labels
│   ├── bart_classifier.py      # BART zero-shot classifier
│   ├── bertopic_classifier.py  # BERTopic classifier wrapper
│   ├── language.detect.py      # Train language detection model
│   └── pkl/                    # Saved language model (auto-generated)
│
├── bertopic_classifier/        # BERTopic models
│   ├── base.py                 # Shared logic (DRY)
│   ├── topic_english.py        # English-only model
│   ├── topic_english_tagalog.py# EN + TL model
│   ├── topic_trilingual.py     # EN + TL + CB model
│   ├── test_models.py          # Test suite
│   ├── bertopic_dataset.csv    # Training data (10k rows)
│   ├── filipino_stopwords.txt
│   └── models/                 # Saved BERTopic models (auto-generated)
│
├── dataset/                    # Datasets
│   ├── clean_dataset.csv
│   ├── original_dataset.csv
│   ├── language_detection_dataset.csv
│   ├── filipino_stopwords.txt
│   └── filipino_names.txt
│
└── tools/                      # Data preparation scripts
```

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
python models/language.detect.py
```

This saves `language_identifer.pkl` in `models/pkl/`.

### 4. Start the server

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
| Language Detection | Logistic Regression language detector | `language` |
