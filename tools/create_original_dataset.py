import os

import pandas as pd


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, "dataset", "extended_dataset.csv")
    output_file = os.path.join(base_dir, "dataset", "original_dataset.csv")

    df = pd.read_csv(input_file)

    columns_to_drop = ["kapampangan", "bicolano"]
    existing_columns = [column for column in columns_to_drop if column in df.columns]
    df = df.drop(columns=existing_columns)

    df.to_csv(output_file, index=False)

    print(f"Loaded: {input_file}")
    print(f"Dropped columns: {existing_columns}")
    print(f"Saved: {output_file}")


if __name__ == "__main__":
    main()
