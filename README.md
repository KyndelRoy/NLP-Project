# Multilingual Topic Classifier

A professional topic classification system that integrates zero-shot classification with multilingual language detection.

## Project Structure
- `index.html`: The frontend user interface.
- `style.css`: Modern styling for the application.
- `script.js`: Frontend logic for interacting with the backend API.
- `models/bart_model.py`: FastAPI backend that runs the classification models.
- `models/language.detect.py`: Script to train the language detection model.
- `dataset/`: Contains the datasets used for training.
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
python models/bart_model.py
```
The server will start at `http://127.0.0.1:8000`.

### 4. Launch the Frontend
Open `index.html` in your favorite web browser.
- **Note**: The backend server must be running for the classification to work.

## Features
- **Multilingual Detection**: Automatically detects if the input is Tagalog, Cebuano, or English.
- **Language Filtering**: If the language is not supported (detected as "other"), topic modeling is skipped to save resources.
- **Multi-Model Support**: Easily switch between different classification models (like BART, DistilRoBERTa, etc.) from a single backend instance.
- **Dynamic Labels**: Candidate labels are fetched from the backend and can be updated without touching the frontend.