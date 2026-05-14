# Configuration for available models

MODEL_CONFIGS = {
    "bart": "facebook/bart-large-mnli"
}

# BERTopic model configurations
BERTOPIC_CONFIGS = {
    "bertopic_en": {
        "name": "BERTopic (English)",
        "model_dir": "models/topic_english",
        "dataset": "bertopic_dataset.csv",
        "columns": ["english"],
        "embedding_model": "all-MiniLM-L6-v2",
        "stopwords": None,
    },
    "bertopic_en_tl": {
        "name": "BERTopic (EN + TL)",
        "model_dir": "models/topic_english_tagalog",
        "dataset": "bertopic_dataset.csv",
        "columns": ["english", "tagalog"],
        "embedding_model": "paraphrase-multilingual-MiniLM-L12-v2",
        "stopwords": "filipino_stopwords.txt",
    },
    "bertopic_tri": {
        "name": "BERTopic (Trilingual)",
        "model_dir": "models/topic_trilingual",
        "dataset": "bertopic_dataset.csv",
        "columns": ["english", "tagalog", "cebuano"],
        "embedding_model": "paraphrase-multilingual-MiniLM-L12-v2",
        "stopwords": "filipino_stopwords.txt",
    },
}

# Default candidate labels for zero-shot classification (BART)
CANDIDATE_LABELS = ["food", "sports", "news", "laws", "education"]
