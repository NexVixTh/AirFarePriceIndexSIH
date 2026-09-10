from __future__ import annotations

import os
import re
from datetime import date, datetime, timedelta, timezone

from playwright.sync_api import sync_playwright

from db.models import FareQuote
from .base import RateLimiter, check_robots_allowed


class IndigoScraper:
    """Playwright scraper for IndiGo direct flight results.

    This scraper targets the official IndiGo site and only extracts values from the
    real flight card DOM subtree. It never invents a fare split when the page does
    not show the breakdown.
    """

    result_card_selector = "[data-testid='flight-card'], [data-test='flight-card'], .flight-card, .fare-card, .flight-result-card, .results-card"
    fare_breakdown_selector = "[data-testid='fare-summary'], [data-test='fare-summary'], [data-testid='fare-details'], [data-test='fare-details'], .fare-summary, .fare-details, .price-breakdown"

    def __init__(self, origin: str = "DEL", destination: str = "BOM", departure_date: str | date | None = None) -> None:
        self.origin = origin.upper()
        self.destination = destination.upper()
        self.departure_date = self._parse_date(departure_date)
        self.headless = os.getenv("PLAYWRIGHT_HEADLESS", "false").lower() == "true"
        self.timeout_seconds = int(os.getenv("SCRAPE_TIMEOUT_SECONDS", "60"))
        self.rate_limiter = RateLimiter(min_interval_seconds=float(os.getenv("SCRAPE_RATE_SECONDS", "7")))

    @staticmethod
    def _parse_date(value: str | date | None) -> date:
        if value is None:
            return (datetime.now(timezone.utc).date() + timedelta(days=7))
        if isinstance(value, date):
            return value
        return datetime.strptime(str(value), "%Y-%m-%d").date()

    @staticmethod
    def _money_to_float(value: str | None) -> float | None:
        if value is None:
            return None
        digits = re.sub(r"[^0-9]", "", str(value))
        if not digits:
            return None
        return float(digits)

    @staticmethod
    def _pretty_text(node) -> str:
        return (node.inner_text(" ") or "").strip()

    def _site_url(self) -> str:
        return "https://www.goindigo.in"

    def _search_url(self) -> str:
        return (
            "https://www.goindigo.in/booking/flight-select?" 
            f"origin={self.origin}&destination={self.destination}&departDate={self.departure_date.strftime('%d-%m-%Y')}"
        )

    def _open_date_picker(self, page) -> None:
        for selector in [
            "button[aria-label*='date']",
            "[data-testid='departure-date']",
            "[data-test='departure-date']",
            "input[type='date']",
            "button:has-text('Departure')",
            "button:has-text('Select date')",
        ]:
            locator = page.locator(selector)
            if locator.count() > 0:
                try:
                    locator.first.click(timeout=self.timeout_seconds * 1000)
                    return
                except Exception:
                    continue

    def _select_departure_date(self, page) -> None:
        self._open_date_picker(page)
        date_text = self.departure_date.strftime("%d")
        for cell in page.locator("td, button, div[role='button']").all():
            text = (cell.inner_text(" ") or "").strip()
            if text == date_text:
                try:
                    cell.click(timeout=self.timeout_seconds * 1000)
                    return
                except Exception:
                    continue

    def _build_breakdown(self, total_fare: float | None, base_fare: float | None = None, taxes_fees: float | None = None) -> dict[str, float | None]:
        if total_fare is None:
            return {"base_fare": None, "taxes_fees": None, "total_fare": None}

        if base_fare is None or taxes_fees is None:
            return {"base_fare": None, "taxes_fees": None, "total_fare": float(total_fare)}

        return {"base_fare": float(base_fare), "taxes_fees": float(taxes_fees), "total_fare": float(total_fare)}

    def _extract_breakdown(self, card) -> dict[str, float | None]:
        total_text = None
        base_text = None
        taxes_text = None

        price_tokens = card.locator("text=/₹|INR|Rs|rs/i").all()
        for token in price_tokens:
            text = (token.inner_text(" ") or "").strip()
            if text and re.search(r"₹|INR|Rs", text, flags=re.I):
                total_text = total_text or text
                break

        breakdown = card.locator(self.fare_breakdown_selector)
        if breakdown.count() > 0:
            breakdown_text = breakdown.first.inner_text(" ")
            values = re.findall(r"₹\s*([0-9,]+(?:\.[0-9]+)?)", breakdown_text or "")
            if len(values) >= 2:
                total_text = total_text or values[0]
                if len(values) >= 3:
                    base_text = values[0]
                    taxes_text = values[1]
                else:
                    base_text = values[0]
                    taxes_text = values[1] if len(values) > 1 else None

        total_fare = self._money_to_float(total_text)
        base_fare = self._money_to_float(base_text)
        taxes_fees = self._money_to_float(taxes_text)

        return self._build_breakdown(total_fare, base_fare, taxes_fees)

    def _extract_offers(self, page) -> list[FareQuote]:
        quote_rows: list[FareQuote] = []
        seen_keys: set[tuple[str, int, str]] = set()

        for card in page.locator(self.result_card_selector).all():
            if card.count() == 0:
                continue
            card_text = self._pretty_text(card)
            if len(card_text) < 30:
                continue
            if self.origin not in card_text.upper() and self.destination not in card_text.upper():
                if not re.search(r"\b(?:6E|AI|IX|SG|G8|9W|I5|UK|NQ|2T)\b", card_text.upper()):
                    continue

            breakdown = self._extract_breakdown(card)
            total_fare = breakdown["total_fare"]
            if total_fare is None:
                continue
            if total_fare < 500 or total_fare > 500000:
                continue

            airline_match = re.search(r"\b(?:6E|AI|IX|SG|G8|9W|I5|UK|NQ|2T)\b", card_text.upper())
            carrier = airline_match.group(0) if airline_match else "INDIGO"
            key = (carrier, int(total_fare), card_text[:80])
            if key in seen_keys:
                continue
            seen_keys.add(key)

            days_until_departure = max((self.departure_date - datetime.now(timezone.utc).date()).days, 0)
            quote_rows.append(
                FareQuote(
                    origin=self.origin,
                    destination=self.destination,
                    carrier=carrier,
                    source_site="goindigo",
                    scrape_timestamp=datetime.now(timezone.utc),
                    departure_date=self.departure_date,
                    advance_purchase_days=days_until_departure,
                    fare_class="ECONOMY",
                    base_fare=breakdown["base_fare"],
                    taxes_fees=breakdown["taxes_fees"],
                    total_fare=float(total_fare),
                    is_available=True,
                )
            )

        return quote_rows

    def run(self) -> list[FareQuote]:
        check_robots_allowed(self._site_url())
        self.rate_limiter.wait()

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=self.headless)
            page = browser.new_page(viewport={"width": 1440, "height": 1400}, locale="en-IN")
            try:
                page.goto(self._site_url(), wait_until="domcontentloaded", timeout=self.timeout_seconds * 1000)
                page.wait_for_load_state("networkidle", timeout=self.timeout_seconds * 1000)

                # Search form: direct airline site usually exposes a route form and
                # a calendar widget rather than a plain text field. We open the date
                # picker and select the target date cell instead of blindly calling fill().
                try:
                    page.locator("input[placeholder*='From' i], input[aria-label*='From' i], input[name*='origin' i]").first.fill(self.origin)
                    page.locator("input[placeholder*='To' i], input[aria-label*='To' i], input[name*='destination' i]").first.fill(self.destination)
                except Exception:
                    pass

                self._select_departure_date(page)

                for selector in [
                    "button:has-text('Search')",
                    "button:has-text('Book')",
                    "button:has-text('Search flights')",
                    "input[type='submit']",
                ]:
                    locator = page.locator(selector)
                    if locator.count() > 0:
                        try:
                            locator.first.click(timeout=self.timeout_seconds * 1000)
                            break
                        except Exception:
                            continue

                page.wait_for_selector(self.result_card_selector, timeout=self.timeout_seconds * 1000)
                quotes = self._extract_offers(page)
            finally:
                browser.close()

        return quotes
