# Multilingual Topic Extraction & Prediction

Topic extraction and prediction using BERTopic on parallel-translated text (English, Tagalog, Cebuano).

## Structure

```
bertopic_classifier/
├── base.py                    # Shared logic (DRY) — load, train, predict
├── topic_english.py           # English-only model
├── topic_english_tagalog.py   # English + Tagalog model
├── topic_trilingual.py        # English + Tagalog + Cebuano model
├── test_models.py             # Test suite (61 cases)
├── bertopic_dataset.csv       # Training data (10,000 rows)
├── filipino_stopwords.txt     # Stopwords for multilingual models
├── README.md
└── models/                    # Saved models (auto-generated on first run)
    ├── topic_english/
    ├── topic_english_tagalog/
    └── topic_trilingual/
```

## Standalone Usage

Each script can be run independently from this directory:

```bash
python topic_english.py
python topic_english_tagalog.py
python topic_trilingual.py
```

First run trains and saves the model. Subsequent runs load instantly.

## Server Integration

All three models are also available through the main FastAPI server via `models/bertopic_classifier.py`. Select them from the dropdown:

- **BERTopic (English)** — `bertopic_en`
- **BERTopic (EN + TL)** — `bertopic_en_tl`
- **BERTopic (Trilingual)** — `bertopic_tri`

## Re-training

Delete the `models/` folder (or a specific subfolder) and run again.
