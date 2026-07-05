"""Subreddit-based scraping: fetch top posts from each active subreddit."""

from __future__ import annotations

from typing import Any

import db
from reddit_scraper import fetch_top_posts


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]

    total = 0
    for target in db.get_active_targets("subreddit"):
        subreddit = target["subreddit"]
        posts = fetch_top_posts(subreddit, time_filter=time_filter, limit=limit)

        rows = [
            {
                "subreddit_id": target["id"],
                "subreddit": subreddit,
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

        total += db.upsert_posts("subreddit", rows)

    return total
