import pandas as pd
from bertopic import BERTopic

# 1. Load your parallel dataset
df = pd.read_csv("../dataset/clean_dataset.csv")

# --- FIX: Drop rows where 'english' text is missing to avoid ValueError ---
df = df.dropna(subset=['english'])

# 2. Extract ONLY the English column for the discovery phase
english_texts = df['english'].tolist()

# 3. Initialize BERTopic
topic_model = BERTopic(language="english")

# 4. Discover the topics!
topics, probabilities = topic_model.fit_transform(english_texts)

# 5. See what the AI discovered
topic_info = topic_model.get_topic_info()
print("--- Discovered Topics ---")
print(topic_info[['Topic', 'Count', 'Name']])

# 6. Attach labels back
df['topic_id'] = topics

# Save your newly labeled dataset
df.to_csv("labeled_parallel_dataset.csv", index=False)

topic_info = topic_model.get_topic_info().head(5)
print("--- Discovered Topics ---")
print(topic_info[['Topic', 'Count', 'Name']])

# 6. Attach labels back
df['topic_id'] = topics

# Save your newly labeled dataset
df.to_csv("labeled_parallel_dataset.csv", index=False)

columns_to_drop = ['kapampangan', 'bicolano','other']

# Check if columns exist before dropping to avoid errors
existing_columns_to_drop = [col for col in columns_to_drop if col in df.columns]

if existing_columns_to_drop:
    df = df.drop(columns=existing_columns_to_drop)
    print(f"Dropped columns: {existing_columns_to_drop}")
else:
    print("Specified columns not found in the DataFrame.")

# display(df.head())

# Save the DataFrame with the dropped columns to a CSV file
df.to_csv("labeled_parallel_dataset.csv", index=False)
print("Updated 'labeled_parallel_dataset.csv' with the current DataFrame.")

# 1. Input the text you want to classify
new_text = "theres a cool car with a coffee inside" # @param {type:"string"}

# 2. Use the model to predict the topic
predicted_topics, predicted_probs = topic_model.transform([new_text])

# 3. Display the result
topic_id = predicted_topics[0]
topic_label = topic_model.get_topic_info(topic_id)['Name'].values[0]

print(f"Input Text: {new_text}")
print(f"Predicted Topic ID: {topic_id}")
print(f"Topic Name: {topic_label}")