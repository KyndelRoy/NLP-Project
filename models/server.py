from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import joblib
import os

# Import configuration
from config import MODEL_CONFIGS, CANDIDATE_LABELS

app = FastAPI(title="Multilingual NLP Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dictionary to hold loaded pipelines (lazy loading)
loaded_models = {}

def get_model(model_id):
    if model_id not in loaded_models:
        if model_id not in MODEL_CONFIGS:
            raise ValueError(f"Model {model_id} is not configured in config.py")
            
        print(f"Loading {model_id} model ({MODEL_CONFIGS[model_id]})...")
        loaded_models[model_id] = pipeline("zero-shot-classification", model=MODEL_CONFIGS[model_id])
    return loaded_models[model_id]

# Resolve paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LANGUAGE_MODEL_PATH = os.path.join(BASE_DIR, 'pkl', 'language_identifer.pkl')

# Load Language Detector at startup
print("Initializing Language Detector...")
try:
    language_model = joblib.load(LANGUAGE_MODEL_PATH)
    print("Language model loaded!")
except Exception as e:
    print(f"Warning: Could not load language model from {LANGUAGE_MODEL_PATH}: {e}")
    language_model = None

print("System ready!")

class ClassifyRequest(BaseModel):
    text: str
    model: str = "bart" # Default model

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
    try:
        classifier = get_model(req.model)
        result = classifier(req.text, candidate_labels=CANDIDATE_LABELS)
        return {
            "label": result['labels'][0], 
            "score": result['scores'][0], 
            "language": detected_lang
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Note: We use "server:app" here
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
