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
    max_posts = config.get("max_posts_per_run", 50)
    candidate_limit = min(limit * CANDIDATE_MULTIPLIER, CANDIDATE_LIMIT_CAP)

    targets = db.get_active_targets("phrase")
    print(f"[phrase] {len(targets)} active phrase(s), cap {max_posts} post(s)/run")

    total = 0
    for target in targets:
        if total >= max_posts:
            print(f"[phrase] reached cap of {max_posts}, stopping early")
            break

        phrase = target["phrase"]
        candidates = search_reddit_global(phrase, time_filter=time_filter, limit=candidate_limit)
        errors = [post["error"] for post in candidates if "error" in post]

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

        print(
            f"[phrase] '{phrase}': {len(candidates)} candidates, "
            f"{len(errors)} error(s){f' e.g. {errors[0]}' if errors else ''}, "
            f"{len(rows)} passed >= {PHRASE_MATCH_THRESHOLD:.0%} match"
        )

        rows = rows[:limit][: max_posts - total]
        total += db.upsert_posts("phrase", rows)

    return total
