"""Thin Supabase client wrapper for the scraping pipeline."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from supabase import Client, create_client

MODES = ("keyword", "phrase", "subreddit")

_TARGET_TABLES = {
    "keyword": "keywords",
    "phrase": "phrases",
    "subreddit": "subreddits",
}

_TARGET_COLUMNS = {
    "keyword": "keyword",
    "phrase": "phrase",
    "subreddit": "subreddit",
}

_POSTS_TABLES = {
    "keyword": "posts_based_on_keyword",
    "phrase": "posts_based_on_phrases",
    "subreddit": "posts_based_on_subreddit",
}


@lru_cache(maxsize=1)
def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def get_config(mode: str) -> dict[str, Any]:
    response = get_client().table("config").select("*").eq("mode", mode).single().execute()
    return response.data


def get_active_targets(mode: str) -> list[dict[str, Any]]:
    table = _TARGET_TABLES[mode]
    response = get_client().table(table).select("*").eq("activated", True).execute()
    return response.data or []


def upsert_posts(mode: str, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0

    table = _POSTS_TABLES[mode]
    get_client().table(table).upsert(rows, on_conflict="permalink", ignore_duplicates=True).execute()
    return len(rows)


def mark_ran(mode: str, when: datetime | None = None) -> None:
    when = when or datetime.now(timezone.utc)
    get_client().table("config").update(
        {"last_run_at": when.isoformat(), "updated_at": when.isoformat()}
    ).eq("mode", mode).execute()
