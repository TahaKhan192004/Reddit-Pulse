"""Subreddit-based scraping: fetch top posts from each active subreddit."""

from __future__ import annotations

from typing import Any

import db
from reddit_scraper import fetch_top_posts


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]
    max_posts = config.get("max_posts_per_run", 50)

    targets = db.get_active_targets("subreddit")
    print(f"[subreddit] {len(targets)} active subreddit(s), cap {max_posts} post(s)/run")

    total = 0
    for target in targets:
        if total >= max_posts:
            print(f"[subreddit] reached cap of {max_posts}, stopping early")
            break

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
        ][: max_posts - total]

        print(
            f"[subreddit] r/{subreddit}: {len(posts)} fetched, "
            f"{len(errors)} error(s){f' e.g. {errors[0]}' if errors else ''}, "
            f"{len(rows)} usable"
        )

        total += db.upsert_posts("subreddit", rows)

    return total
