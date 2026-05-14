# Multilingual Topic Modeling Project Plan

## Project Title

**Automatic Multilingual Topic Discovery and Topic Prediction Using Parallel English, Tagalog, and Cebuano Data**

---

## 1. Project Overview

This project uses a parallel translated dataset with three columns:

```text
english
tagalog
cebuano
```

Each row contains the same sentence translated into English, Tagalog, and Cebuano.

The goal is to automatically discover topics from the dataset and allow a user to input a sentence in English, Tagalog, Cebuano, or mixed language. The system will then predict the closest discovered topic.

The dataset is unlabeled, so the project will use unsupervised topic modeling instead of normal supervised classification at the beginning.

The system will:

```text
Load the dataset
Clean the text
Generate multilingual embeddings
Discover topics automatically
Generate English-based topic names
Save the trained topic model
Allow user input for topic prediction
Return the predicted topic name
Evaluate the discovered topics
```

---

## 2. Dataset Description

The dataset is a CSV file named:

```text
data.csv
```

Expected columns:

```text
english
tagalog
cebuano
```

Dataset characteristics:

```text
Rows: around 10,000 parallel rows
Text type: mostly short sentences
Domain: random and general
Labels: no topic labels
Translation quality: high quality
Languages: English, Tagalog, Cebuano
```

Each row should be treated as **one semantic document** because the three columns contain the same meaning in different languages.

Example:

| english | tagalog | cebuano |
|---|---|---|
| I want to eat rice. | Gusto kong kumain ng kanin. | Gusto nako mokaon og kan-on. |

This row should have one topic, not three separate topics.

---

## 3. Main Problem

The dataset has no manually assigned topic labels.

Because of that, the model cannot be trained directly as a normal supervised classifier.

Instead, the correct workflow is:

```text
Unsupervised topic discovery
→ automatic topic assignment
→ topic name generation
→ saved model
→ topic prediction for new input
```

The system should not claim normal classification accuracy because there are no true labels.

Instead, the project should evaluate topic quality using unsupervised topic-modeling metrics.

---

## 4. Main Goal

The main goal is to build a system that can:

```text
Discover topics automatically from the dataset
Predict the topic of a new user input
Accept English, Tagalog, Cebuano, and mixed-language input
Return an English-based topic name
Save the trained model so prediction does not retrain the model
```

Example output:

```text
Input: Gusto nako mokaon og manok.

Predicted Topic ID: 24
Topic Name: food_eat_chicken_meal
Top Words: food, eat, chicken, meal, cook
```

The system does not need to predict the language. It should focus only on topic prediction.

---

## 5. Recommended Approach

Use:

```text
BERTopic + multilingual sentence embeddings
```

Recommended first embedding model:

```text
sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

Reason:

```text
CPU-friendly
works with multilingual text
lighter than larger transformer models
good for school project demonstration
supports English, Tagalog, Cebuano, and mixed input
```

Possible stronger model later:

```text
intfloat/multilingual-e5-base
```

However, the MiniLM multilingual model is recommended first because the laptop is CPU-only.

---

## 6. Important Design Decision

The dataset should not be treated as 30,000 independent documents.

Even if there are 10,000 rows and 3 columns, the project should treat the dataset as:

```text
10,000 semantic rows
```

not:

```text
30,000 unrelated texts
```

Reason:

The English, Tagalog, and Cebuano text in each row have the same meaning.

If the model treats all text independently, it may discover language-based clusters instead of topic-based clusters.

Bad result:

```text
Topic 1 = English sentences
Topic 2 = Tagalog sentences
Topic 3 = Cebuano sentences
```

Good result:

```text
Topic 1 = food, eating, rice, meal
Topic 2 = school, student, teacher, class
Topic 3 = money, price, buy, pay
```

---

## 7. Training Strategy

The best strategy for this project is:

```text
Use English documents for topic representation
Use averaged multilingual embeddings for clustering
```

For each row:

```text
english_embedding = embed(english sentence)
tagalog_embedding = embed(tagalog sentence)
cebuano_embedding = embed(cebuano sentence)

row_embedding = average available embeddings
```

Then train BERTopic using:

```text
documents = english column
embeddings = averaged multilingual row embeddings
```

This gives the project the best balance:

```text
Clustering understands the meaning across three languages
Topic names are based on English words
Prediction supports English, Tagalog, Cebuano, and mixed-language input
```

---

## 8. Topic Naming Strategy

The user does not want to manually rename topics.

Therefore, topic names should be generated automatically from the top English words of each topic.

Example:

```text
Top words:
school, student, teacher, class, lesson

Generated topic name:
school_student_teacher_class
```

Another example:

```text
Top words:
food, eat, rice, meal, cook

Generated topic name:
food_eat_rice_meal
```

Important note:

Automatic topic names may not always look like clean human labels such as:

```text
Food
Education
Law
Travel
```

Instead, they will usually look like keyword-based labels:

```text
food_eat_rice_meal
school_student_teacher_class
money_price_buy_pay
law_right_court_rule
```

This is acceptable because the project is using automatic topic discovery.

---

## 9. Topic Count Strategy

The number of topics should be flexible and based on the dataset.

Since the dataset is random and general, the model may discover many topics.

The previous experiment produced around:

```text
320 topics
```

That is possible because:

```text
The sentences are short
The dataset is general and random
The topics may be very specific
HDBSCAN can create many small clusters
```

The project should not force only 10 or 20 topics.

Instead, the project should allow experiments with different topic sizes.

Recommended experiments:

```text
min_topic_size = 10
min_topic_size = 20
min_topic_size = 30
```

Compare each version using:

```text
number of topics
number of outliers
topic coherence
topic diversity
topic size distribution
sample predictions
```

For the presentation, use the best-performing version based on interpretability and prediction quality.

---

## 10. Outlier Handling

BERTopic may assign some rows to:

```text
Topic -1
```

This means the model considered them outliers or unclear topics.

This is normal in BERTopic because HDBSCAN can produce outlier documents.

The project should handle this properly.

Plan:

```text
Train the BERTopic model
Check how many documents are assigned to Topic -1
If the outlier count is too high, apply outlier reduction
Save the reduced topic assignments
```

For prediction, if the model predicts:

```text
Topic -1
```

The system should display something like:

```text
No strong topic found.
Closest topic suggestion: food_eat_rice_meal
```

This makes the system safer for presentation.

---

## 11. Evaluation Strategy

Because the dataset is unlabeled, the project should not report normal supervised accuracy.

Do not claim:

```text
Accuracy: 95%
```

because there are no true topic labels.

Instead, evaluate using:

```text
Topic coherence
Topic diversity
Outlier percentage
Topic size distribution
Representative documents
Sample predictions
```

For school presentation, explain it this way:

```text
Since the dataset is unlabeled, the model was evaluated using topic coherence,
topic diversity, outlier rate, topic size distribution, and representative document inspection.
```

Recommended evaluation outputs:

```text
Number of discovered topics
Number of outliers
Percentage of outliers
Top words per topic
Representative English documents per topic
Topic diversity score
Topic coherence score
Sample prediction results
```

---

## 12. System Requirements

Development environment:

```text
Operating System: Zorin OS
Processor: Intel Core i5-12450H
RAM: 16 GB
GPU: No dedicated GPU
Graphics: Intel UHD 48EU
Execution: CPU-only
```

Because the system is CPU-only, the project should:

```text
Use a lightweight multilingual embedding model
Cache embeddings
Avoid recomputing embeddings during prediction
Avoid retraining every time
Save the trained BERTopic model
Use batch processing
```

Recommended CPU-friendly settings:

```text
embedding_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
batch_size = 32
calculate_probabilities = False
cache_embeddings = True
```

---

## 13. Project Folder Structure

Recommended folder structure:

```text
multilingual_topic_modeling/
│
├── data/
│   └── data.csv
│
├── models/
│   └── topic_model/
│
├── outputs/
│   ├── cleaned_data.csv
│   ├── row_embeddings.npy
│   ├── topic_assignments.csv
│   ├── topic_info.csv
│   ├── topic_labels.json
│   ├── evaluation_report.json
│   └── sample_predictions.csv
│
├── src/
│   ├── config.py
│   ├── clean_data.py
│   ├── embed_rows.py
│   ├── train_topic_model.py
│   ├── generate_topic_labels.py
│   ├── evaluate_topics.py
│   ├── predict_topic.py
│   └── utils.py
│
├── run_pipeline.py
├── demo_predict.py
└── requirements.txt
```

---

## 14. File Responsibilities

### 14.1 `config.py`

Purpose:

```text
Store all project settings in one place
```

Should contain:

```text
CSV file path
Column names
Embedding model name
Output paths
Model save path
Batch size
Minimum topic size
Random seed
```

---

### 14.2 `clean_data.py`

Purpose:

```text
Load and clean the dataset
```

Responsibilities:

```text
Load data.csv
Check if english, tagalog, and cebuano columns exist
Handle missing or blank values
Remove rows with missing English text
Keep rows with missing Tagalog or Cebuano if English exists
Convert all text to string
Apply light cleaning
Save cleaned_data.csv
```

Important:

Do not over-clean the text because transformer embeddings work better with natural sentence structure.

Basic cleaning only:

```text
lowercase
strip whitespace
normalize spaces
remove fully empty rows
```

Avoid aggressive cleaning such as:

```text
removing all meaningful words
removing names
removing too many special characters
```

---

### 14.3 `embed_rows.py`

Purpose:

```text
Create multilingual row embeddings
```

Responsibilities:

```text
Load cleaned_data.csv
Load multilingual sentence-transformer model
Embed English text
Embed Tagalog text if available
Embed Cebuano text if available
Average available embeddings per row
Save row_embeddings.npy
```

This file is important because the project is CPU-only.

By saving embeddings, the project avoids recomputing embeddings every time.

---

### 14.4 `train_topic_model.py`

Purpose:

```text
Train the BERTopic model
```

Responsibilities:

```text
Load cleaned English documents
Load row_embeddings.npy
Create BERTopic model
Train model using English documents and averaged embeddings
Save trained topic model
Save topic assignments
Save topic_info.csv
```

Recommended configuration:

```text
language = "english"
min_topic_size = flexible
calculate_probabilities = False
verbose = True
```

---

### 14.5 `generate_topic_labels.py`

Purpose:

```text
Generate automatic English-based topic names
```

Responsibilities:

```text
Load trained BERTopic model
Get top words for each topic
Remove Topic -1 from normal label generation
Create keyword-based topic labels
Save topic_labels.json
```

Example generated labels:

```text
food_eat_rice_meal
school_student_teacher_class
money_price_buy_pay
law_court_right_rule
```

---

### 14.6 `evaluate_topics.py`

Purpose:

```text
Evaluate discovered topic quality
```

Responsibilities:

```text
Count number of topics
Count outliers
Calculate outlier percentage
Calculate topic diversity
Calculate topic coherence if possible
Save evaluation_report.json
Save topic summary
```

Evaluation should focus on unsupervised metrics, not accuracy.

---

### 14.7 `predict_topic.py`

Purpose:

```text
Predict the topic of new user input
```

Responsibilities:

```text
Load saved BERTopic model
Load same multilingual embedding model
Load topic_labels.json
Clean user input
Generate embedding for user input
Use BERTopic transform to predict topic
Return topic ID
Return topic name
Return top words
Return confidence if available
```

Input can be:

```text
English
Tagalog
Cebuano
Mixed language
```

The system should not predict language.

---

### 14.8 `run_pipeline.py`

Purpose:

```text
Run the full training pipeline
```

Pipeline flow:

```text
1. Clean data
2. Generate row embeddings
3. Train BERTopic model
4. Generate topic labels
5. Evaluate topics
6. Save all outputs
```

This file is only used when training or retraining is needed.

---

### 14.9 `demo_predict.py`

Purpose:

```text
Provide an interactive terminal demo for presentation
```

Example:

```text
Enter sentence: Gusto nako mokaon og manok

Predicted Topic ID: 24
Topic Name: food_eat_chicken_meal
Top Words: food, eat, chicken, meal, cook
```

This file should not retrain the model.

It should only load the saved model and predict.

---

## 15. Full Pipeline Flow

Training pipeline:

```text
data/data.csv
→ clean_data.py
→ outputs/cleaned_data.csv
→ embed_rows.py
→ outputs/row_embeddings.npy
→ train_topic_model.py
→ models/topic_model/
→ outputs/topic_assignments.csv
→ outputs/topic_info.csv
→ generate_topic_labels.py
→ outputs/topic_labels.json
→ evaluate_topics.py
→ outputs/evaluation_report.json
```

Prediction pipeline:

```text
User input
→ light cleaning
→ multilingual embedding
→ BERTopic transform
→ topic ID
→ topic label lookup
→ display predicted topic
```

---

## 16. Expected Prediction Output

Recommended output format:

```text
Input: Gusto nako mokaon og manok.

Predicted Topic ID: 24
Topic Name: food_eat_chicken_meal
Top Words: food, eat, chicken, meal, cook
```

Optional output with confidence:

```text
Input: The student is reading a book.

Predicted Topic ID: 11
Topic Name: school_student_book_read
Top Words: school, student, book, read, teacher
Confidence: 0.76
```

If the model predicts outlier:

```text
Input: random unclear sentence

Predicted Topic ID: -1
Topic Name: No strong topic found
Suggestion: Try a clearer or more specific sentence.
```

---

## 17. Stopword Strategy

Since topic names are based on the English column, English stopwords are the most important for topic representation.

Recommended strategy:

```text
Use English stopwords for topic word generation
Keep Filipino stopwords available but not required for English-based topic names
Do not remove names
Do not over-clean text before embeddings
```

Important:

For embeddings, avoid aggressive stopword removal because sentence-transformer models understand meaning better when the sentence remains natural.

For topic labels, stopwords can be removed because labels are based on top words.

---

## 18. Why Not Use LDA as the Main Model?

LDA is not recommended as the main model for this project because:

```text
The dataset is multilingual
The sentences are short
The data is random and general
Tagalog and Cebuano are lower-resource languages
Words with the same meaning may appear differently across languages
```

Example:

```text
law
batas
balaod
```

LDA depends heavily on word frequency and may not understand that these words are semantically related.

BERTopic with multilingual embeddings is better because it focuses more on semantic meaning.

---

## 19. Why Not Merge the Three Columns Directly?

Avoid directly merging the three columns like this:

```text
english + tagalog + cebuano
```

Reason:

It can create messy mixed-language topic words.

Example bad topic words:

```text
eat, kumain, mokaon, rice, kanin, kan-on
```

This may still work, but the topic labels become harder to read.

Better approach:

```text
Use English text for topic words
Use averaged multilingual embeddings for semantic clustering
```

This keeps topic names clean and English-based while still using the multilingual meaning.

---

## 20. Final Recommended Architecture

Use this architecture:

```text
Model:
BERTopic

Embedding model:
sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

Training documents:
English column

Training embeddings:
Average of English + Tagalog + Cebuano embeddings per row

Topic names:
Automatically generated from English top words

Prediction input:
English, Tagalog, Cebuano, or mixed language

Prediction output:
Topic ID + English keyword-based topic name + top words

Evaluation:
Topic coherence, topic diversity, outlier rate, topic size distribution, representative documents

Project style:
Separated Python files with saved model and cached embeddings
```

---

## 21. Recommended Development Order

Build the project in this order:

```text
1. Create folder structure
2. Create config.py
3. Create clean_data.py
4. Test cleaning output
5. Create embed_rows.py
6. Save row_embeddings.npy
7. Create train_topic_model.py
8. Save BERTopic model
9. Create generate_topic_labels.py
10. Create evaluate_topics.py
11. Create predict_topic.py
12. Create demo_predict.py
13. Create run_pipeline.py
14. Test with English input
15. Test with Tagalog input
16. Test with Cebuano input
17. Test with mixed-language input
18. Prepare presentation results
```

---

## 22. Presentation Explanation

Use this explanation during presentation:

```text
This project uses unsupervised topic modeling because the dataset does not have topic labels.

The dataset contains parallel English, Tagalog, and Cebuano translations.
Each row is treated as one semantic document.

The system uses multilingual sentence embeddings to represent the meaning of each row.
The embeddings from the English, Tagalog, and Cebuano columns are averaged to create one row-level semantic representation.

BERTopic is then used to discover topics automatically.
The English column is used for topic representation, so the generated topic names are English-based.

After training, the model is saved.
During prediction, the user can enter English, Tagalog, Cebuano, or mixed-language text.
The system embeds the input and predicts the closest discovered topic.

Since the data is unlabeled, the model is evaluated using topic coherence,
topic diversity, outlier percentage, topic size distribution, and sample predictions instead of normal accuracy.
```

---

## 23. Key Limitations

The project has some limitations:

```text
The topics are automatically discovered, so they may not always match human expectations.
The topic names are keyword-based, not manually refined.
Short sentences can create many small topics.
Random general data can produce broad or noisy clusters.
There is no true accuracy score because the data has no labels.
Some inputs may be assigned as outliers.
```

These limitations are normal for unsupervised topic modeling.

---

## 24. Final Summary

The final project should be:

```text
A multilingual topic discovery and prediction system
using BERTopic and multilingual sentence embeddings.
```

The best plan is:

```text
Treat each row as one semantic document.
Use averaged English, Tagalog, and Cebuano embeddings.
Train BERTopic using English text for topic representation.
Generate automatic English keyword-based topic names.
Save the model.
Allow user input in English, Tagalog, Cebuano, or mixed language.
Predict the closest discovered topic.
Evaluate using unsupervised topic-modeling metrics.
```

This is the most realistic and professional approach for a school project using unlabeled parallel multilingual data.
