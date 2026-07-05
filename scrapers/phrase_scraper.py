"""Phrase-based scraping: search all of Reddit, keep posts with >=70% word overlap."""

from __future__ import annotations

from typing import Any

import db
from matching import word_overlap_ratio, PHRASE_MATCH_THRESHOLD
from reddit_scraper import search_reddit_global

CANDIDATE_MULTIPLIER = 4
CANDIDATE_LIMIT_CAP = 100


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]
    candidate_limit = min(limit * CANDIDATE_MULTIPLIER, CANDIDATE_LIMIT_CAP)

    total = 0
    for target in db.get_active_targets("phrase"):
        phrase = target["phrase"]
        candidates = search_reddit_global(phrase, time_filter=time_filter, limit=candidate_limit)

        rows = []
        for post in candidates:
            if "error" in post or not post.get("permalink"):
                continue

            text = f"{post['title']} {post['selftext']}"
            match_score = word_overlap_ratio(phrase, text)
            if match_score < PHRASE_MATCH_THRESHOLD:
                continue

            rows.append(
                {
                    "phrase_id": target["id"],
                    "phrase": phrase,
                    "subreddit": post.get("subreddit", ""),
                    "title": post["title"],
                    "selftext": post["selftext"],
                    "url": post["url"],
                    "permalink": post["permalink"],
                    "score": post["score"],
                    "num_comments": post["num_comments"],
                    "created_utc": post["created_utc"],
                    "match_score": round(match_score, 4),
                }
            )

        total += db.upsert_posts("phrase", rows[:limit])

    return total
