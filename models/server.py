from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

# Import configuration and specialized models
from config import MODEL_CONFIGS, CANDIDATE_LABELS
from bart_classifier import BartClassifier

app = FastAPI(title="Multilingual NLP Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LANGUAGE_MODEL_PATH = os.path.join(BASE_DIR, 'pkl', 'language_identifer.pkl')

# --- Startup Initialization ---
print("Initializing System...")

# 1. Load Language Detector
try:
    language_model = joblib.load(LANGUAGE_MODEL_PATH)
    print("Language model loaded!")
except Exception as e:
    print(f"Warning: Could not load language model: {e}")
    language_model = None

# 2. Load Classification Models (all at once)
print("Loading NLP models...")
models = {
    "bart": BartClassifier(MODEL_CONFIGS["bart"]),
    # Add future models here:
    # "new_model": NewModelClassifier(MODEL_CONFIGS["new_model"])
}

print("System ready!")

class ClassifyRequest(BaseModel):
    text: str
    model: str = "bart"

@app.get("/labels")
def get_labels():
    return {"labels": CANDIDATE_LABELS}

@app.post("/classify")
def classify_text(req: ClassifyRequest):
    # 1. Language Detection
    detected_lang = "unknown"
    if language_model:
        detected_lang = language_model.predict([req.text])[0]
        
    if detected_lang == "other":
        return {
            "label": "N/A", 
            "score": 0.0, 
            "language": detected_lang, 
            "message": "Language not supported for topic modeling."
        }
    
    # 2. Topic Classification
    if req.model not in models:
        return {"error": f"Model '{req.model}' is not initialized on the server."}
        
    try:
        classifier = models[req.model]
        result = classifier.classify(req.text, candidate_labels=CANDIDATE_LABELS)
        
        if 'labels' in result:
            return {
                "labels": result['labels'],
                "scores": result['scores'],
                "language": detected_lang
            }
        else:
            return {
                "label": result['label'],
                "score": result['score'],
                "language": detected_lang
            }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # app_dir=BASE_DIR tells uvicorn to look for "server.py" inside the "models" folder
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True, app_dir=BASE_DIR)
