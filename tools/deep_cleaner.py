import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
import os

def clean_text(text, stop_words):
    if not isinstance(text, str):
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove numbers and special characters (keep only letters and spaces)
    # This also removes common Filipino markers like hyphens if we aren't careful, 
    # but the prompt specifically asked to "remove numbers and special characters".
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
    # Tokenize by splitting
    words = text.split()
    
    # Remove stopwords
    cleaned_words = [w for w in words if w not in stop_words]
    
    return " ".join(cleaned_words)

def main():
    # Paths
    input_file = '/home/roy/Desktop/UMTC/ml2/dataset/original_dataset.csv'
    stopwords_file = '/home/roy/Desktop/UMTC/ml2/dataset/filipino_stopwords.txt'
    output_file = '/home/roy/Desktop/UMTC/ml2/dataset/clean_dataset.csv'
    
    # Ensure NLTK stopwords are downloaded
    try:
        nltk.download('stopwords', quiet=True)
    except Exception as e:
        print(f"Note: Could not download NLTK stopwords: {e}")

    # Load dataset
    print(f"Loading dataset from {input_file}...")
    df = pd.read_csv(input_file)
    
    # Drop columns
    cols_to_drop = ['kapampangan', 'bicolano', 'other']
    existing_cols_to_drop = [col for col in cols_to_drop if col in df.columns]
    df = df.drop(columns=existing_cols_to_drop)
    print(f"Dropped columns: {existing_cols_to_drop}")
    
    # Load Stopwords
    eng_stopwords = set(stopwords.words('english'))
    
    fil_stopwords = set()
    if os.path.exists(stopwords_file):
        with open(stopwords_file, 'r', encoding='utf-8') as f:
            fil_stopwords = set(line.strip().lower() for line in f if line.strip())
        print(f"Loaded {len(fil_stopwords)} Filipino stopwords.")
    else:
        print(f"Warning: {stopwords_file} not found.")
        
    combined_stopwords = eng_stopwords.union(fil_stopwords)
    
    # Clean text columns
    text_columns = ['tagalog', 'english', 'cebuano']
    for col in text_columns:
        if col in df.columns:
            print(f"Cleaning column: {col}...")
            df[col] = df[col].apply(lambda x: clean_text(x, combined_stopwords))
    
    # Save output
    df.to_csv(output_file, index=False)
    print(f"Cleaned dataset saved to {output_file}")

if __name__ == "__main__":
    main()
