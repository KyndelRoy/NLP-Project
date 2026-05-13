import os

import pandas as pd


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, "dataset", "original_dataset.csv")
    output_file = os.path.join(base_dir, "dataset", "language_detection_dataset.csv")

    df = pd.read_csv(input_file)
    language_columns = ["cebuano", "tagalog", "english", "other"]
    rows = []

    for _, row in df.iterrows():
        for language in language_columns:
            text = row.get(language)
            if pd.isna(text) or str(text).strip() == "":
                continue
            rows.append({"text": str(text).strip(), "language": language})

    df_reshaped = pd.DataFrame(rows, columns=["text", "language"])

    df_reshaped.to_csv(output_file, index=False)

    print(f"Loaded: {input_file}")
    print(f"Saved: {output_file}")


if __name__ == "__main__":
    main()
