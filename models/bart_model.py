from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import joblib
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration for available models
# You can add more models to this dictionary as you go
MODEL_CONFIGS = {
    "bart": "facebook/bart-large-mnli",
    "fast": "cross-encoder/nli-distilroberta-base", # A lighter/faster alternative
    "specialized": "facebook/bart-large-mnli" # Placeholder for specialized model
}

# Dictionary to hold loaded pipelines
loaded_models = {}

def get_model(model_id):
    if model_id not in loaded_models:
        print(f"Loading {model_id} model ({MODEL_CONFIGS[model_id]})...")
        loaded_models[model_id] = pipeline("zero-shot-classification", model=MODEL_CONFIGS[model_id])
    return loaded_models[model_id]

# Load default model and language detector at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print("Initializing system...")
default_classifier = get_model("bart")

language_model_path = os.path.join(BASE_DIR, 'pkl', 'language_identifer.pkl')
try:
    language_model = joblib.load(language_model_path)
    print("Language model loaded!")
except Exception as e:
    print(f"Warning: Could not load language model: {e}")
    language_model = None

candidate_labels = ["lifestyle", "food", "sports", "news", "laws", "school", "unrelated to the list"]
print("System ready!")

class ClassifyRequest(BaseModel):
    text: str
    model: str = "bart" # Default to bart

@app.get("/labels")
def get_labels():
    return {"labels": candidate_labels}

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
    
    # 2. Topic Classification with selected model
    try:
        classifier = get_model(req.model)
        result = classifier(req.text, candidate_labels=candidate_labels)
        label = result['labels'][0]
        score = result['scores'][0]
        return {"label": label, "score": score, "language": detected_lang}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 to make it accessible if needed, or stick to 127.0.0.1
    uvicorn.run("bart_model:app", host="127.0.0.1", port=8000, reload=True)