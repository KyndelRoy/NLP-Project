"""Compatibility launcher for the standard language_detector module.

Keep this file so the documented command `python models/language.detect.py`
continues to train the same language detector artifact.
"""

import os
import sys

try:
    from .language_detector import main, train_language_detector
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from language_detector import main, train_language_detector


if __name__ == "__main__":
    main()
