"""
Cleartrip OTA Scraper

Scrapes real-time fares from Cleartrip, a popular Indian OTA.
"""

from __future__ import annotations

import os
import re
from datetime import date, datetime, timedelta, timezone

from playwright.sync_api import sync_playwright

from db.models import FareQuote
from .base import RateLimiter, check_robots_allowed


class CleartripScraper:
    """Scraper for Cleartrip OTA platform."""
    
    def __init__(self, origin: str = "DEL", destination: str = "BOM", departure_date: str | date | None = None) -> None:
        self.origin = origin.upper()
        self.destination = destination.upper()
        self.departure_date = self._parse_date(departure_date)
        self.headless = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"
        self.timeout_seconds = int(os.getenv("SCRAPE_TIMEOUT_SECONDS", "60"))
        self.rate_limiter = RateLimiter(min_interval_seconds=float(os.getenv("SCRAPE_RATE_SECONDS", "7")))
    
    @staticmethod
    def _parse_date(value: str | date | None) -> date:
        if value is None:
            return (datetime.now(timezone.utc).date() + timedelta(days=7))
        if isinstance(value, date):
            return value
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    
    def _site_url(self) -> str:
        return "https://www.cleartrip.com"
    
    def _search_url(self) -> str:
        return (
            f"https://www.cleartrip.com/flights/results?"
            f"origin={self.origin}&destination={self.destination}"
            f"&depart={self.departure_date.strftime('%Y-%m-%d')}&rdepart="
        )
    
    def _extract_offers(self, page) -> list[FareQuote]:
        """Extract flight offers from Cleartrip."""
        quote_rows: list[FareQuote] = []
        seen_keys: set[tuple[str, int]] = set()
        
        flight_cards = page.locator("[class*='FlightResult'], [class*='flight'], [data-testid*='result']").all()
        
        for card in flight_cards:
            try:
                card_text = (card.inner_text(" ") or "").strip()
                if len(card_text) < 20:
                    continue
                
                price_match = re.search(r"₹\s*([0-9,]+)", card_text)
                if not price_match:
                    continue
                
                total_fare = int(price_match.group(1).replace(",", ""))
                if total_fare < 500 or total_fare > 500000:
                    continue
                
                airline_match = re.search(
                    r"\b(?:6E|AI|IX|SG|G8|9W)\b",
                    card_text.upper()
                )
                carrier = airline_match.group(0) if airline_match else "UNKNOWN"
                
                key = (carrier, total_fare)
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                
                days_until_departure = max((self.departure_date - datetime.now(timezone.utc).date()).days, 0)
                
                quote_rows.append(
                    FareQuote(
                        origin=self.origin,
                        destination=self.destination,
                        carrier=carrier,
                        source_site="cleartrip",
                        scrape_timestamp=datetime.now(timezone.utc),
                        departure_date=self.departure_date,
                        advance_purchase_days=days_until_departure,
                        fare_class="ECONOMY",
                        base_fare=float(total_fare * 0.70),
                        taxes_fees=float(total_fare * 0.30),
                        total_fare=float(total_fare),
                        is_available=True,
                    )
                )
            except Exception:
                continue
        
        return quote_rows
    
    def run(self) -> list[FareQuote]:
        """Execute Cleartrip scraping."""
        check_robots_allowed(self._site_url())
        self.rate_limiter.wait()
        
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=self.headless)
            page = browser.new_page(viewport={"width": 1440, "height": 1200}, locale="en-IN")
            try:
                page.goto(self._search_url(), wait_until="domcontentloaded", timeout=self.timeout_seconds * 1000)
                page.wait_for_load_state("networkidle", timeout=self.timeout_seconds * 1000)
                
                page.wait_for_selector(
                    "[class*='FlightResult'], [class*='flight']",
                    timeout=self.timeout_seconds * 1000
                )
                
                quotes = self._extract_offers(page)
            finally:
                browser.close()
        
        return quotes
