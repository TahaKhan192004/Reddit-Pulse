"""Subreddit-based scraping: fetch top posts from each active subreddit."""

from __future__ import annotations

from typing import Any

import db
from reddit_scraper import fetch_top_posts


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]

    targets = db.get_active_targets("subreddit")
    print(f"[subreddit] {len(targets)} active subreddit(s)")

    total = 0
    for target in targets:
        subreddit = target["subreddit"]
        posts = fetch_top_posts(subreddit, time_filter=time_filter, limit=limit)
        errors = [post["error"] for post in posts if "error" in post]

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

        print(
            f"[subreddit] r/{subreddit}: {len(posts)} fetched, "
            f"{len(errors)} error(s){f' e.g. {errors[0]}' if errors else ''}, "
            f"{len(rows)} usable"
        )

        total += db.upsert_posts("subreddit", rows)

    return total
