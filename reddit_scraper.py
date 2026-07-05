"""Scrape Reddit via app-only OAuth (client_credentials) — no user login required."""

from __future__ import annotations

import os
import time
from typing import Any
from urllib.parse import quote_plus, urlparse, urlunparse

import requests


# Plain, descriptive UA — not spoofing a browser. Override via env var if needed.
USER_AGENT = os.environ.get("REDDIT_USER_AGENT", "RedditContentScraper/1.0 (research bot; no scraping)")
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}
VALID_TIME_FILTERS = {"day", "week", "month", "year", "all"}
OAUTH_BASE = "https://oauth.reddit.com"

_token_cache: dict[str, Any] = {"token": None, "expires_at": 0.0}


def _get_access_token() -> str:
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"]:
        return _token_cache["token"]

    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set")

    last_error = ""
    for attempt in range(3):
        try:
            response = requests.post(
                "https://www.reddit.com/api/v1/access_token",
                data={"grant_type": "client_credentials"},
                auth=(client_id, client_secret),
                headers={"User-Agent": USER_AGENT},
                timeout=20,
            )
        except requests.RequestException as exc:
            last_error = f"Token request failed: {exc}"
            time.sleep(8)
            continue

        if response.status_code == 200:
            payload = response.json()
            token = payload["access_token"]
            expires_in = payload.get("expires_in", 3600)
            _token_cache["token"] = token
            _token_cache["expires_at"] = now + expires_in - 60
            return token

        last_error = f"Reddit OAuth token request failed: HTTP {response.status_code}"
        if attempt < 2:
            time.sleep(8)

    raise RuntimeError(last_error)


def _to_oauth_url(url: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(scheme="https", netloc="oauth.reddit.com"))


def _error(message: str) -> list[dict[str, Any]]:
    return [{"error": message}]


def _normalize_time_filter(time_filter: str) -> str:
    return time_filter if time_filter in VALID_TIME_FILTERS else "month"


def _normalize_limit(limit: int, default: int = 25, maximum: int = 100) -> int:
    try:
        value = int(limit)
    except (TypeError, ValueError):
        return default
    return max(1, min(value, maximum))


def _get_json(url: str) -> Any:
    last_error = ""

    for attempt in range(2):
        try:
            token = _get_access_token()
            headers = {**HEADERS, "Authorization": f"Bearer {token}"}
            response = requests.get(url, headers=headers, timeout=20)
        except (requests.RequestException, RuntimeError) as exc:
            last_error = f"Request failed: {exc}"
            break

        if response.status_code == 429 and attempt == 0:
            time.sleep(10)
            continue

        if response.status_code == 401 and attempt == 0:
            _token_cache["token"] = None
            continue

        if response.status_code != 200:
            last_error = f"Reddit returned HTTP {response.status_code}"
            break

        try:
            return response.json()
        except ValueError as exc:
            last_error = f"Invalid JSON response: {exc}"
            break

    raise RuntimeError(last_error or "Unknown Reddit request error")


def _post_from_child(child: dict[str, Any]) -> dict[str, Any] | None:
    data = child.get("data", {})
    if not isinstance(data, dict):
        return None

    selftext = data.get("selftext") or ""
    if selftext.strip() in {"[removed]", "[deleted]"}:
        selftext = ""

    permalink = data.get("permalink") or ""
    if permalink and permalink.startswith("/"):
        permalink = f"https://reddit.com{permalink}"

    return {
        "title": data.get("title", ""),
        "score": data.get("score", 0),
        "num_comments": data.get("num_comments", 0),
        "permalink": permalink,
        "selftext": selftext[:5000],
        "url": data.get("url", ""),
        "created_utc": data.get("created_utc"),
        "subreddit": data.get("subreddit", ""),
    }


def _parse_posts(response_json: dict[str, Any]) -> list[dict[str, Any]]:
    children = response_json.get("data", {}).get("children", [])
    posts: list[dict[str, Any]] = []

    for child in children:
        if not isinstance(child, dict):
            continue
        post = _post_from_child(child)
        if post:
            posts.append(post)

    return posts


def fetch_top_posts(subreddit: str, time_filter: str = "month", limit: int = 25) -> list[dict[str, Any]]:
    """Fetch top posts from a subreddit using Reddit's public .json endpoint."""

    subreddit = subreddit.strip().lstrip("r/")
    time_filter = _normalize_time_filter(time_filter)
    limit = _normalize_limit(limit)
    url = f"{OAUTH_BASE}/r/{quote_plus(subreddit)}/top.json?t={time_filter}&limit={limit}"

    try:
        return _parse_posts(_get_json(url))
    except Exception as exc:
        return _error(str(exc))
    finally:
        time.sleep(1)


def fetch_comments(permalink: str, limit: int = 15) -> list[dict[str, Any]]:
    """Fetch top comments for a Reddit post permalink."""

    limit = _normalize_limit(limit, default=15)
    base_url = permalink.strip()
    if not base_url.startswith("http"):
        base_url = f"https://reddit.com{base_url if base_url.startswith('/') else '/' + base_url}"
    base_url = base_url.split("?")[0].rstrip("/")
    url = _to_oauth_url(f"{base_url}.json?limit={limit}&sort=top")

    try:
        response_json = _get_json(url)
        if not isinstance(response_json, list) or len(response_json) < 2:
            return []

        children = response_json[1].get("data", {}).get("children", [])
        comments: list[dict[str, Any]] = []

        for child in children:
            data = child.get("data", {}) if isinstance(child, dict) else {}
            if not isinstance(data, dict):
                continue

            author = data.get("author")
            body = data.get("body") or ""
            if author == "AutoModerator" or body in {"[deleted]", "[removed]"}:
                continue

            comments.append(
                {
                    "body": body[:500],
                    "score": data.get("score", 0),
                }
            )

        return comments
    except Exception as exc:
        return _error(str(exc))
    finally:
        time.sleep(1)


def search_subreddit(
    subreddit: str,
    query: str,
    time_filter: str = "month",
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Search a subreddit for a keyword or topic."""

    subreddit = subreddit.strip().lstrip("r/")
    time_filter = _normalize_time_filter(time_filter)
    limit = _normalize_limit(limit, default=20)
    encoded_query = quote_plus(query)
    url = (
        f"{OAUTH_BASE}/r/{quote_plus(subreddit)}/search.json"
        f"?q={encoded_query}&sort=relevance&t={time_filter}&limit={limit}&restrict_sr=1"
    )

    try:
        return _parse_posts(_get_json(url))
    except Exception as exc:
        return _error(str(exc))
    finally:
        time.sleep(1)


def search_reddit_global(
    query: str,
    time_filter: str = "month",
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Search all of Reddit (not restricted to one subreddit) for a keyword or phrase."""

    time_filter = _normalize_time_filter(time_filter)
    limit = _normalize_limit(limit, default=25)
    encoded_query = quote_plus(query)
    url = (
        f"{OAUTH_BASE}/search.json"
        f"?q={encoded_query}&sort=relevance&t={time_filter}&limit={limit}"
    )

    try:
        return _parse_posts(_get_json(url))
    except Exception as exc:
        return _error(str(exc))
    finally:
        time.sleep(1)


def fetch_multi_subreddit(
    subreddits: list[str],
    time_filter: str = "month",
    limit: int = 15,
) -> dict[str, list[dict[str, Any]]]:
    """Fetch top posts from multiple subreddits and keep going if one fails."""

    results: dict[str, list[dict[str, Any]]] = {}

    for index, subreddit in enumerate(subreddits):
        subreddit_name = subreddit.strip().lstrip("r/")
        results[subreddit_name] = fetch_top_posts(subreddit_name, time_filter, limit)

        if index < len(subreddits) - 1:
            time.sleep(2)

    return results
