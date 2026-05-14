#!/usr/bin/env python3
"""Clean multilingual CSV text data for modeling."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


DEFAULT_INPUT = "original_dataset.csv"
DEFAULT_OUTPUT = "cleaned_dataset.csv"
DEFAULT_NAMES = "filipino_names.txt"


def load_names(path: Path) -> set[str]:
    """Load names as lowercase tokens to remove from text."""
    with path.open("r", encoding="utf-8") as file:
        return {
            line.strip().lower()
            for line in file
            if line.strip() and not line.lstrip().startswith("#")
        }


def clean_text(text: str, names: set[str]) -> str:
    """Lowercase text, remove numbers/special characters, and drop names."""
    text = text.lower()
    letters_and_spaces = "".join(
        character if character.isalpha() or character.isspace() else " "
        for character in text
    )
    words = [
        word
        for word in letters_and_spaces.split()
        if word not in names
    ]
    return " ".join(words)


def row_has_missing_columns(row: list[str], expected_columns: int) -> bool:
    return len(row) != expected_columns or any(not cell.strip() for cell in row)


def clean_dataset(
    input_path: Path,
    output_path: Path,
    names_path: Path,
    min_words_per_row: int,
) -> dict[str, int]:
    names = load_names(names_path)

    stats = {
        "total_rows": 0,
        "kept_rows": 0,
        "dropped_missing_columns": 0,
        "dropped_empty_after_cleaning": 0,
        "dropped_too_short": 0,
    }

    with input_path.open("r", encoding="utf-8-sig", newline="") as input_file:
        reader = csv.reader(input_file)
        header = next(reader)
        expected_columns = len(header)
        columns_to_keep = [
            index
            for index, column_name in enumerate(header)
            if column_name.strip().lower() != "other"
        ]
        output_header = [header[index] for index in columns_to_keep]

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8", newline="") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(output_header)

            for row in reader:
                stats["total_rows"] += 1

                if row_has_missing_columns(row, expected_columns):
                    stats["dropped_missing_columns"] += 1
                    continue

                cleaned_row = [
                    clean_text(row[index], names)
                    for index in columns_to_keep
                ]

                if any(not cell for cell in cleaned_row):
                    stats["dropped_empty_after_cleaning"] += 1
                    continue

                row_word_count = sum(len(cell.split()) for cell in cleaned_row)
                if row_word_count < min_words_per_row:
                    stats["dropped_too_short"] += 1
                    continue

                writer.writerow(cleaned_row)
                stats["kept_rows"] += 1

    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Clean original_dataset.csv by lowercasing, removing numbers, "
            "punctuation/special characters, listed names, incomplete rows, "
            "and rows with only one word after cleaning."
        )
    )
    parser.add_argument(
        "--input",
        default=DEFAULT_INPUT,
        type=Path,
        help=f"CSV file to clean. Default: {DEFAULT_INPUT}",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        type=Path,
        help=f"Where to save the cleaned CSV. Default: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--names",
        default=DEFAULT_NAMES,
        type=Path,
        help=f"Name list to remove. Default: {DEFAULT_NAMES}",
    )
    parser.add_argument(
        "--min-words-per-row",
        default=2,
        type=int,
        help=(
            "Drop a row when the entire cleaned row has fewer than this many words. "
            "Default: 2"
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    stats = clean_dataset(
        input_path=args.input,
        output_path=args.output,
        names_path=args.names,
        min_words_per_row=args.min_words_per_row,
    )

    print(f"Saved cleaned CSV to: {args.output}")
    for name, value in stats.items():
        print(f"{name}: {value}")


if __name__ == "__main__":
    main()
