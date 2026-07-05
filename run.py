"""CLI entrypoint for the scheduled/manual scraping pipeline.

Usage:
    python run.py --mode all
    python run.py --mode phrase --force
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from typing import Any

from dotenv import load_dotenv

load_dotenv()

import db
from scrapers import keyword_scraper, phrase_scraper, subreddit_scraper

SCHEDULE_WINDOW = timedelta(minutes=10)

_RUNNERS = {
    "keyword": keyword_scraper.run,
    "phrase": phrase_scraper.run,
    "subreddit": subreddit_scraper.run,
}


def _parse_hhmm(value: str, on_date: datetime) -> datetime:
    hour, minute = (int(part) for part in value.split(":"))
    return on_date.replace(hour=hour, minute=minute, second=0, microsecond=0)


def should_run(config: dict[str, Any], now: datetime, force: bool) -> bool:
    if force:
        return True
    if not config.get("enabled"):
        return False

    last_run_at = config.get("last_run_at")
    last_run = datetime.fromisoformat(last_run_at) if last_run_at else None

    for hhmm in config.get("scheduled_times") or []:
        scheduled_at = _parse_hhmm(hhmm, now)
        if abs(now - scheduled_at) <= SCHEDULE_WINDOW:
            if last_run is None or last_run < scheduled_at:
                return True

    return False


def run_mode(mode: str, now: datetime, force: bool) -> None:
    config = db.get_config(mode)

    if not should_run(config, now, force):
        print(f"[{mode}] skipped (not due, not enabled, or not forced)")
        return

    inserted = _RUNNERS[mode](config)
    db.mark_ran(mode, now)
    print(f"[{mode}] ran — upserted {inserted} post(s)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Reddit scraping pipeline")
    parser.add_argument("--mode", choices=["all", *db.MODES], default="all")
    parser.add_argument("--force", action="store_true", help="ignore the schedule and run now")
    args = parser.parse_args()

    now = datetime.now(timezone.utc)
    modes = db.MODES if args.mode == "all" else [args.mode]

    for mode in modes:
        run_mode(mode, now, args.force)


if __name__ == "__main__":
    main()
