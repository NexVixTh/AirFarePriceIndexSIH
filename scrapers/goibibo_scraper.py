from __future__ import annotations

import os
import re
from datetime import date, datetime, timedelta, timezone

from playwright.sync_api import sync_playwright

from db.models import FareQuote
from .base import RateLimiter, check_robots_allowed


class GoibiboScraper:
    """Playwright scraper for Goibibo flight results.

    Why Playwright here: Goibibo is a modern JS-heavy OTA. The search page loads
    most of its content client-side, so simple requests + BeautifulSoup would miss
    the real inventory. Playwright is preferred over Selenium because it offers a
    faster, modern browser engine, better auto-waiting, and cleaner selector API.
    """

    def __init__(self, origin: str = "DEL", destination: str = "BOM", departure_date: str | date | None = None) -> None:
        self.origin = origin.upper()
        self.destination = destination.upper()
        self.departure_date = self._parse_date(departure_date)
        self.headless = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"
        self.timeout_seconds = int(os.getenv("SCRAPE_TIMEOUT_SECONDS", "45"))
        self.rate_limiter = RateLimiter(min_interval_seconds=float(os.getenv("SCRAPE_RATE_SECONDS", "7")))

    @staticmethod
    def _parse_date(value: str | date | None) -> date:
        if value is None:
            return (datetime.now(timezone.utc).date() + timedelta(days=7))
        if isinstance(value, date):
            return value
        return datetime.strptime(str(value), "%Y-%m-%d").date()

    def _site_url(self) -> str:
        return "https://www.goibibo.com/flights"

    def _search_url(self) -> str:
        return (
            f"https://www.goibibo.com/flights/{self.origin}-{self.destination}-flights-"
            f"{self.departure_date.strftime('%Y-%m-%d')}/"
        )

    def _fill_city_field(self, page, selector_candidates: list[str], city_code: str) -> None:
        for selector in selector_candidates:
            locators = page.locator(selector)
            if locators.count() == 0:
                continue
            locators.first.fill(city_code)
            page.keyboard.press("Tab")
            return

    def _extract_offers(self, page) -> list[FareQuote]:
        quote_rows: list[FareQuote] = []
        seen_keys: set[tuple[str, int]] = set()

        for card in page.locator("div, li, article").all():
            text = (card.inner_text(" ") or "").strip()
            if len(text) < 30 or "₹" not in text:
                continue

            if self.origin not in text.upper() and self.destination not in text.upper():
                # A lot of the page contains generic content, so we only keep cards that
                # plausibly mention the route or a flight code in the same block.
                if not re.search(r"\b(?:6E|AI|IX|SG|G8|9W|I5|UK|NQ|2T)\b", text.upper()):
                    continue

            prices = re.findall(r"₹\s*([0-9,]{3,})", text)
            if not prices:
                continue

            total_fare = int(prices[0].replace(",", ""))
            if total_fare < 500 or total_fare > 500000:
                continue

            airline_match = re.search(r"\b(?:6E|AI|IX|SG|G8|9W|I5|UK|NQ|2T)\b", text.upper())
            carrier = airline_match.group(0) if airline_match else "UNKNOWN"
            key = (carrier, total_fare)
            if key in seen_keys:
                continue
            seen_keys.add(key)

            days_until_departure = (self.departure_date - datetime.now(timezone.utc).date()).days
            quote_rows.append(
                FareQuote(
                    origin=self.origin,
                    destination=self.destination,
                    carrier=carrier,
                    source_site="goibibo",
                    scrape_timestamp=datetime.now(timezone.utc),
                    departure_date=self.departure_date,
                    advance_purchase_days=max(days_until_departure, 0),
                    fare_class="ECONOMY",
                    base_fare=float(total_fare * 0.72),
                    taxes_fees=float(total_fare * 0.28),
                    total_fare=float(total_fare),
                    is_available=True,
                )
            )

        return quote_rows

    def run(self) -> list[FareQuote]:
        """Open a real Goibibo search page, fill route information, and extract live fare offers."""
        check_robots_allowed(self._site_url())
        self.rate_limiter.wait()

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=self.headless)
            page = browser.new_page(viewport={"width": 1440, "height": 1200}, locale="en-IN")
            try:
                page.goto(self._search_url(), wait_until="domcontentloaded", timeout=self.timeout_seconds * 1000)
                page.wait_for_load_state("networkidle", timeout=self.timeout_seconds * 1000)

                # Playwright concepts:
                # - locator() finds page elements like inputs or buttons.
                # - fill() types into the field instead of raw JavaScript manipulation.
                # - wait_for_load_state() waits for the page to finish its network work
                #   instead of using a fixed sleep.
                self._fill_city_field(
                    page,
                    [
                        "input[placeholder*='From']",
                        "input[aria-label*='From']",
                        "input[placeholder*='Origin']",
                        "input[name*='source']",
                        "input[id*='from']",
                    ],
                    self.origin,
                )
                self._fill_city_field(
                    page,
                    [
                        "input[placeholder*='To']",
                        "input[aria-label*='To']",
                        "input[placeholder*='Destination']",
                        "input[name*='destination']",
                        "input[id*='to']",
                    ],
                    self.destination,
                )

                try:
                    page.locator("button:has-text('Search')").click(timeout=self.timeout_seconds * 1000)
                except Exception:
                    page.keyboard.press("Enter")

                page.wait_for_selector("text=/₹|Price|fare/i", timeout=self.timeout_seconds * 1000)
                quotes = self._extract_offers(page)
            finally:
                browser.close()

        return quotes
