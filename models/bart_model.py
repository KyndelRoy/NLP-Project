from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import joblib
import os

app = FastAPI()

# Enable CORS so the frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model ONCE
print("Loading model... please wait.")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Load Language Model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
language_model_path = os.path.join(BASE_DIR, 'pkl', 'language_identifer.pkl')
try:
    language_model = joblib.load(language_model_path)
    print("Language model loaded!")
except Exception as e:
    print(f"Warning: Could not load language model: {e}")
    language_model = None

candidate_labels = ["lifestyle", "food", "sports", "news", "laws", "school", "unrelated to the list"]

print("Model ready!")

class ClassifyRequest(BaseModel):
    text: str

@app.get("/labels")
def get_labels():
    return {"labels": candidate_labels}

@app.post("/classify")
def classify_text(req: ClassifyRequest):
    detected_lang = "unknown"
    if language_model:
        detected_lang = language_model.predict([req.text])[0]
        
    if detected_lang == "other":
        return {"label": "N/A", "score": 0.0, "language": detected_lang, "message": "Language not supported for topic modeling."}
        
    result = classifier(req.text, candidate_labels=candidate_labels)
    label = result['labels'][0]
    score = result['scores'][0]
    return {"label": label, "score": score, "language": detected_lang}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("bart_model:app", host="127.0.0.1", port=8000, reload=True)