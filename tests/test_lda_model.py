import csv
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from models import lda_model


class LdaModelTests(unittest.TestCase):
    def test_committed_dataset_is_balanced_for_target_labels(self):
        dataset_path = Path("dataset/lda_training_dataset.csv")
        self.assertTrue(dataset_path.exists())

        with dataset_path.open(newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

        counts = {}
        for row in rows:
            counts[row["label"]] = counts.get(row["label"], 0) + 1

        self.assertEqual(
            set(counts),
            {"food", "sports", "news", "laws", "education"},
        )
        self.assertEqual(len(set(counts.values())), 1)
        self.assertGreaterEqual(next(iter(counts.values())), 100)

    def test_train_and_classify_with_small_corpus(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            dataset_path = tmp_path / "corpus.csv"
            stopwords_path = tmp_path / "stopwords.txt"
            pkl_dir = tmp_path / "pkl"
            vectorizer_path = pkl_dir / "lda_vectorizer.pkl"
            model_path = pkl_dir / "lda_model.pkl"
            metadata_path = pkl_dir / "lda_metadata.pkl"

            with dataset_path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=["text", "label"])
                writer.writeheader()
                writer.writerows(
                    [
                        {"text": "Masarap na pagkain at adobo para sa hapunan", "label": "food"},
                        {"text": "Basketball laro koponan nanalo sa palaro", "label": "sports"},
                        {"text": "Balita gobyerno pangulo ulat sa Maynila", "label": "news"},
                        {"text": "Korte batas karapatan at bagong patakaran", "label": "laws"},
                        {"text": "Paaralan guro mag-aaral aralin pagsusulit", "label": "education"},
                    ]
                )

            stopwords_path.write_text("at\nsa\nunti-unti\n", encoding="utf-8")

            with patch.object(lda_model, "PKL_DIR", str(pkl_dir)), patch.object(
                lda_model, "VECTORIZER_PATH", str(vectorizer_path)
            ), patch.object(lda_model, "LDA_MODEL_PATH", str(model_path)), patch.object(
                lda_model, "LDA_METADATA_PATH", str(metadata_path)
            ):
                lda_model.train_lda(
                    str(dataset_path),
                    str(stopwords_path),
                    n_components=3,
                )
                classifier = lda_model.LDAClassifier()
                result = classifier.classify("Balita mula sa gobyerno")

            self.assertEqual(len(result["labels"]), 3)
            self.assertEqual(len(result["scores"]), 3)
            self.assertAlmostEqual(sum(result["scores"]), 1.0)
            self.assertTrue(vectorizer_path.exists())
            self.assertTrue(model_path.exists())
            self.assertTrue(metadata_path.exists())


if __name__ == "__main__":
    unittest.main()
