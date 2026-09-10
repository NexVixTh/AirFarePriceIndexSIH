from __future__ import annotations

import time
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser

import requests


class RobotsPolicyError(RuntimeError):
    """Raised when a source refuses automated access according to robots.txt."""


class RateLimiter:
    """Simple in-process throttle to avoid hammering a source."""

    def __init__(self, min_interval_seconds: float = 7.0):
        self.min_interval_seconds = min_interval_seconds
        self.last_request_at: float | None = None

    def wait(self) -> None:
        if self.last_request_at is None:
            self.last_request_at = time.monotonic()
            return

        elapsed = time.monotonic() - self.last_request_at
        if elapsed < self.min_interval_seconds:
            time.sleep(self.min_interval_seconds - elapsed)
        self.last_request_at = time.monotonic()


def check_robots_allowed(target_url: str, user_agent: str = "*", timeout_seconds: int = 5) -> bool:
    """Check robots.txt before scraping. This is a hard ethical safeguard with timeout protection."""
    robots_url = urljoin(target_url.rstrip("/") + "/", "robots.txt")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        resp = requests.get(
            robots_url,
            timeout=timeout_seconds,
            headers={"User-Agent": user_agent if user_agent != "*" else "APIx-Scraper/1.0"}
        )
        if resp.status_code == 200:
            parser.parse(resp.text.splitlines())
        elif resp.status_code in (401, 403):
            raise RobotsPolicyError(f"robots.txt HTTP {resp.status_code} denies access on {target_url}")
        else:
            # 404 or other non-200: standard behavior allows scraping if no robots.txt exists
            return True
    except RobotsPolicyError:
        raise
    except Exception as exc:  # pragma: no cover - network failures happen in live scraping.
        raise RobotsPolicyError(f"Unable to fetch robots.txt for {target_url}: {exc}") from exc

    has_permission = parser.can_fetch(user_agent, target_url)
    if not has_permission:
        raise RobotsPolicyError(f"robots.txt denies scraping for {user_agent} on {target_url}")

    return True


def fetch_with_timeout(url: str, timeout_seconds: int = 30) -> requests.Response:
    """Fetch a URL with explicit timeout so scrapers fail fast instead of hanging."""
    return requests.get(url, timeout=timeout_seconds, headers={"User-Agent": "APIx-Scraper/1.0"})
