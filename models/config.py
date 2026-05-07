# Configuration for available models
# Add more HuggingFace model paths here to expand the system
MODEL_CONFIGS = {
    "bart": "facebook/bart-large-mnli",
    "fast": "cross-encoder/nli-distilroberta-base",
    "specialized": "facebook/bart-large-mnli" 
}

# Default candidate labels for classification in BART
CANDIDATE_LABELS = ["food", "sports", "news", "laws", "education"]
