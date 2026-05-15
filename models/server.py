from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import joblib
import os

from config import MODEL_CONFIGS, BERTOPIC_CONFIGS, CANDIDATE_LABELS
from bart_classifier import BartClassifier
from bertopic_classifier import BertopicClassifier
from lda_model import LDAClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LANGUAGE_MODEL_PATH = os.path.join(BASE_DIR, 'pkl', 'language_identifer.pkl')

language_model = None
models = {}
models_loaded = False


def load_models():
    global language_model, models, models_loaded

    if models_loaded:
        return

    print("Starting System...")

    try:
        language_model = joblib.load(LANGUAGE_MODEL_PATH)
        print("Language model loaded")
    except Exception as e:
        print(f"Warning: Could not load language model: {e}")
        language_model = None

    print("Loading NLP models...")
    loaded_models = {
        "bart": BartClassifier(MODEL_CONFIGS["bart"]),
    }

    for key, config in BERTOPIC_CONFIGS.items():
        try:
            loaded_models[key] = BertopicClassifier(config)
        except Exception as e:
            print(f"Warning: Could not load BERTopic model '{key}': {e}")

    try:
        loaded_models["lda"] = LDAClassifier()
    except Exception as e:
        print(f"Warning: Could not load LDA model: {e}")

    models = loaded_models
    models_loaded = True
    print(f"System ready! Loaded models: {list(models.keys())}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield


app = FastAPI(title="Multilingual NLP Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClassifyRequest(BaseModel):
    text: str
    model: str = "bart"


def detect_language(text: str):
    if not language_model:
        return {
            "primary_language": "unknown",
            "primary_score": 0.0,
            "topic_languages": "unknown",
            "ranked_languages": []
        }

    if hasattr(language_model, "predict_proba"):
        probas = language_model.predict_proba([text])[0]
        classes = language_model.classes_

        lang_probs = {cls.lower(): float(prob) for cls, prob in zip(classes, probas)}
        sorted_langs = sorted(lang_probs.items(), key=lambda x: x[1], reverse=True)
        primary_lang, primary_prob = sorted_langs[0]

        if primary_lang == 'other' and primary_prob > 0.5:
            topic_languages = 'other'
        else:
            significant_langs = []
            for lang, prob in sorted_langs:
                if lang == 'other':
                    continue
                if prob >= 0.25:
                    significant_langs.append(lang)

            if not significant_langs:
                for lang, prob in sorted_langs:
                    if lang != 'other':
                        significant_langs.append(lang)
                        break

            topic_languages = significant_langs

        return {
            "primary_language": primary_lang,
            "primary_score": primary_prob,
            "topic_languages": topic_languages,
            "ranked_languages": sorted_langs
        }

    lang = language_model.predict([text])[0].lower()
    return {
        "primary_language": lang,
        "primary_score": 1.0,
        "topic_languages": [lang],
        "ranked_languages": [(lang, 1.0)]
    }


@app.get("/labels")
def get_labels():
    return {"labels": CANDIDATE_LABELS}


@app.post("/classify")
def classify_text(req: ClassifyRequest):
    load_models()

    # Language Detection mode
    language_result = detect_language(req.text)
    detected_lang = language_result["topic_languages"]

    if req.model == "language":
        if not language_model:
            return {"error": "Language detection model is not initialized on the server."}
        return {
            "type": "language_detection",
            "language": language_result["primary_language"],
            "score": language_result["primary_score"]
        }

    # Reject unsupported languages
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

    # Check model exists
    if req.model not in models:
        return {"error": f"Model '{req.model}' is not initialized on the server."}

    try:
        classifier = models[req.model]

        # BERTopic models return single label (no candidate_labels needed)
        if req.model.startswith("bertopic_"):
            result = classifier.classify(req.text)
            return {
                "label": result["label"],
                "score": result["score"],
                "language": detected_lang
            }

        # BART / LDA models use candidate labels
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
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True, app_dir=BASE_DIR)
