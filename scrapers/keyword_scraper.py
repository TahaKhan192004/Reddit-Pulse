"""Keyword-based scraping: search all of Reddit for each active keyword."""

from __future__ import annotations

from typing import Any

import db
from reddit_scraper import search_reddit_global


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]

    targets = db.get_active_targets("keyword")
    print(f"[keyword] {len(targets)} active keyword(s)")

    total = 0
    for target in targets:
        keyword = target["keyword"]
        posts = search_reddit_global(keyword, time_filter=time_filter, limit=limit)
        errors = [post["error"] for post in posts if "error" in post]

        rows = [
            {
                "keyword_id": target["id"],
                "keyword": keyword,
                "subreddit": post.get("subreddit", ""),
                "title": post["title"],
                "selftext": post["selftext"],
                "url": post["url"],
                "permalink": post["permalink"],
                "score": post["score"],
                "num_comments": post["num_comments"],
                "created_utc": post["created_utc"],
            }
            for post in posts
            if "error" not in post and post.get("permalink")
        ]

        print(
            f"[keyword] '{keyword}': {len(posts)} fetched, "
            f"{len(errors)} error(s){f' e.g. {errors[0]}' if errors else ''}, "
            f"{len(rows)} usable"
        )

        total += db.upsert_posts("keyword", rows)

    return total
