"""Keyword-based scraping: search all of Reddit for each active keyword."""

from __future__ import annotations

from typing import Any

import db
from reddit_scraper import search_reddit_global


def run(config: dict[str, Any]) -> int:
    limit = config["limit_per_target"]
    time_filter = config["time_filter"]
    max_posts = config.get("max_posts_per_run", 50)

    targets = db.get_active_targets("keyword")
    print(f"[keyword] {len(targets)} active keyword(s), cap {max_posts} post(s)/run")

    total = 0
    for target in targets:
        if total >= max_posts:
            print(f"[keyword] reached cap of {max_posts}, stopping early")
            break

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
        ][: max_posts - total]

        print(
            f"[keyword] '{keyword}': {len(posts)} fetched, "
            f"{len(errors)} error(s){f' e.g. {errors[0]}' if errors else ''}, "
            f"{len(rows)} usable"
        )

        total += db.upsert_posts("keyword", rows)

    return total
