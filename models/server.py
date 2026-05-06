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
        if hasattr(language_model, "predict_proba"):
            probas = language_model.predict_proba([req.text])[0]
            classes = language_model.classes_
            
            lang_probs = {cls: prob for cls, prob in zip(classes, probas)}
            sorted_langs = sorted(lang_probs.items(), key=lambda x: x[1], reverse=True)
            primary_lang, primary_prob = sorted_langs[0]
            
            if primary_lang == 'other' and primary_prob > 0.5:
                detected_lang = 'other'
            else:
                significant_langs = []
                for lang, prob in sorted_langs:
                    if lang == 'other':
                        continue
                    if prob >= 0.25:
                        significant_langs.append(lang.capitalize())
                
                if not significant_langs:
                    for lang, prob in sorted_langs:
                        if lang != 'other':
                            significant_langs.append(lang.lower())
                            break
                else:
                    significant_langs = [lang.lower() for lang in significant_langs]
                            
                detected_lang = significant_langs
        else:
            lang = language_model.predict([req.text])[0]
            detected_lang = [lang.lower()]
        
    # Check if 'other' is in the list and it's the only one
    if isinstance(detected_lang, list) and len(detected_lang) == 1 and detected_lang[0] == 'other':
        return {
            "label": "N/A", 
            "score": 0.0, 
            "language": ["other"], 
            "message": "Language not supported for topic modeling."
        }
    elif detected_lang == 'other':
        return {
            "label": "N/A", 
            "score": 0.0, 
            "language": ["other"], 
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
