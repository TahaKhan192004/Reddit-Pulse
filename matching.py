"""Word-overlap matching for phrase-based scraping."""

from __future__ import annotations

import re

_WORD_RE = re.compile(r"[a-z0-9']+")

PHRASE_MATCH_THRESHOLD = 0.70


def _words(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower()))


def word_overlap_ratio(phrase: str, text: str) -> float:
    """Return the fraction of the phrase's unique words that appear in text."""

    phrase_words = _words(phrase)
    if not phrase_words:
        return 0.0

    text_words = _words(text)
    return len(phrase_words & text_words) / len(phrase_words)


def phrase_matches(phrase: str, text: str, threshold: float = PHRASE_MATCH_THRESHOLD) -> bool:
    return word_overlap_ratio(phrase, text) >= threshold
