# Multilingual Topic Classifier

A professional topic classification system that integrates zero-shot classification with multilingual language detection.

## Project Structure
- `models/server.py`: The main backend server.
- `models/config.py`: configuration for model paths and labels.
- `models/language.detect.py`: Script to train the language detection model.
- `models/bart_classifier.py`: facebook/bart-large-mnli model for classification.
- `models/pkl/`: Contains the trained language detection model (`language_identifer.pkl`).

## How to Run

### 1. Set Up the Environment
First, ensure you have a virtual environment set up and all dependencies installed:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

### 2. (Optional) Retrain Language Detection
If you want to update or retrain the language detection model based on the dataset:
```bash
python models/language.detect.py
```
This will save a new `language_identifer.pkl` in `models/pkl/`.

### 3. Start the Backend API
Run the FastAPI server to handle classification requests:
```bash
python models/server.py
```
The server will start at `http://127.0.0.1:8000`.

### 4. Launch the Frontend
Open `index.html` in your favorite web browser.
- **Note**: The backend server must be running for the classification to work.
