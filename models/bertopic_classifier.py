"""Compatibility wrapper for the renamed FastAPI BERTopic model module."""

try:
    from .bertopic_model import BertopicClassifier
except ImportError:
    from bertopic_model import BertopicClassifier

__all__ = ["BertopicClassifier"]
