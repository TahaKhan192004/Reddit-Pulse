"""Keyword-based scraping: search all of Reddit for each active keyword."""

from __future__ import annotations

from typing import Any

import db
from reddit_scraper import search_reddit_global


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]

    total = 0
    for target in db.get_active_targets("keyword"):
        keyword = target["keyword"]
        posts = search_reddit_global(keyword, time_filter=time_filter, limit=limit)

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

        total += db.upsert_posts("keyword", rows)

    return total
