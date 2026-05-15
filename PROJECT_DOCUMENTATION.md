# Project Documentation

Professional reference for the Multilingual Topic Classifier codebase.

## Purpose

This project provides a local web application and FastAPI backend for:

- Topic classification in English, Tagalog, and Cebuano.
- Language detection across English, Tagalog, Cebuano, and unsupported/other text.
- Model comparison through BART, BERTopic, LDA, and Logistic Regression.
- Dataset and source-code previews for presentation and inspection.

## Architecture

```text
index.html / style.css / js/
        |
        | HTTP JSON requests
        v
models/server.py  FastAPI application
        |
        | loads and routes predictions to
        v
models/bart_classifier.py
models/bertopic_classifier.py
models/lda_model.py
models/language.detect.py
```

### Frontend

- `index.html` defines the single-page interface.
- `style.css` contains theme, layout, modal, result-card, and responsive styles.
- `js/script.js` controls app state, model selection, theme selection, and API requests.
- `js/results-view.js` renders classification and language-detection results.
- `js/viewer.js` renders source-code and dataset previews.
- `js/app-utils.js` contains shared escaping, syntax highlighting, CSV parsing, and language formatting helpers.

### Backend

- `models/server.py` exposes:
  - `GET /labels`
  - `POST /classify`
- Model loading happens in FastAPI lifespan startup, not during plain module import.
- `load_models()` is guarded so repeated calls in the same process do not reload models.
- Runtime configuration:
  - `HOST`, default `127.0.0.1`
  - `PORT`, default `8000`
  - `RELOAD`, default `true`
  - `LOG_LEVEL`, default `INFO`

### Model Artifacts

Language detector:

- Trained by `models/language.detect.py`.
- Saved at `models/pkl/language_identifer.pkl`.

LDA:

- Trained by `models/lda_model.py`.
- Saved at `models/pkl/lda_vectorizer.pkl`, `models/pkl/lda_model.pkl`, and `models/pkl/lda_metadata.pkl`.
- If artifacts are missing, `LDAClassifier` trains from `dataset/lda_training_dataset.csv`.

BERTopic:

- Uses saved BERTopic directories under `bertopic_classifier/models/`.
- Saved models contain files such as `config.json`, `topics.json`, `ctfidf.safetensors`, and `topic_embeddings.safetensors`.
- The loader uses saved models when present and trains only when the configured model directory is missing.

BART:

- Uses Hugging Face `facebook/bart-large-mnli`.
- It may download/cache model files through the local Hugging Face cache.

## Development Workflow

Create and activate the virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Train or refresh local model artifacts:

```bash
python models/language.detect.py
python models/lda_model.py
python bertopic_classifier/topic_english.py
python bertopic_classifier/topic_english_tagalog.py
python bertopic_classifier/topic_trilingual.py
```

Start the backend:

```bash
python models/server.py
```

Start without reload:

```bash
RELOAD=false python models/server.py
```

Open `index.html` in a browser. For dataset/code preview fetches, serving the folder through a local static server is more reliable than opening the file directly:

```bash
python -m http.server 5500
```

Then visit `http://127.0.0.1:5500`.

## API Reference

### `GET /labels`

Returns candidate topic labels.

Response:

```json
{
  "labels": ["food", "sports", "news", "laws", "education"]
}
```

### `POST /classify`

Request:

```json
{
  "text": "The students studied for their exam at school.",
  "model": "bart"
}
```

Valid model keys:

- `bart`
- `lda`
- `bertopic_en`
- `bertopic_en_tl`
- `bertopic_tri`
- `language`

Topic response shape:

```json
{
  "labels": ["education"],
  "scores": [0.91],
  "language": ["english"]
}
```

Language response shape:

```json
{
  "type": "language_detection",
  "language": "english",
  "score": 0.98
}
```

## Quality Checks

Run unit tests:

```bash
python -m unittest discover -s tests -v
```

Run syntax checks:

```bash
python -m py_compile models/server.py models/lda_model.py models/bertopic_classifier.py models/bart_classifier.py models/language.detect.py
node --check js/app-utils.js
node --check js/results-view.js
node --check js/script.js
node --check js/viewer.js
```

## Engineering Notes

- Keep generated model artifacts out of normal source changes unless the project explicitly needs to version a small baseline artifact.
- Avoid adding model loading at module import time; heavy initialization belongs in startup paths.
- Escape all text rendered from backend responses before inserting it into `innerHTML`.
- Prefer reusable CSS classes over inline styles so theme and responsive behavior stay consistent.
- Keep training scripts import-safe by placing execution under `if __name__ == "__main__":`.

## Known Limitations

- BART startup is heavy and depends on local Hugging Face cache or network availability.
- BERTopic training can take several minutes if saved model directories are missing.
- The frontend API URL defaults to `http://127.0.0.1:8000`; override it by setting `window.API_URL` before loading `js/script.js`.
- `language_identifer.pkl` keeps the original filename spelling for backward compatibility.
