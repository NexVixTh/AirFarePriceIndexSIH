from __future__ import annotations

import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright


SITE_URL = "https://www.goindigo.in"
SEARCH_URL = "https://www.goindigo.in/booking/flight-search?" \
    "origin=DEL&destination=BOM&date=2026-09-01&adults=1&children=0&infants=0&cabin=Economy"
OUT_DIR = Path(__file__).resolve().parent / "debug_output"
OUT_DIR.mkdir(exist_ok=True)


def wait_for_any(page, selectors: list[str], timeout: int = 45000):
    for selector in selectors:
        try:
            page.wait_for_selector(selector, state="visible", timeout=5000)
            return selector
        except Exception:
            continue
    return None


def safe_text(node):
    if node is None:
        return None
    text = node.inner_text()
    if text is None:
        return None
    text = text.strip().replace("\n", " ")
    return text or None


def print_json(label: str, payload: Any) -> None:
    print(f"\n=== {label} ===")
    print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))


def detect_blocking(page) -> str | None:
    block_markers = [
        "captcha",
        "verify you are human",
        "robot",
        "please try again later",
        "security check",
        "we need to confirm you are human",
        "access denied",
        "bot detection",
        "cloudflare",
    ]
    body_text = (page.locator("body").inner_text() or "").lower()
    for marker in block_markers:
        if marker in body_text:
            return marker
    return None


def find_candidate_cards(page):
    selectors = [
        "[data-testid='flight-card']",
        "[data-test='flight-card']",
        ".flight-card",
        ".flight-result-card",
        ".results-card",
        "article",
        "li",
        "div",
    ]
    for selector in selectors:
        count = page.locator(selector).count()
        if count > 0:
            print(f"Selector candidate: {selector} -> count={count}")
            for i in range(min(count, 5)):
                txt = safe_text(page.locator(selector).nth(i))
                if txt:
                    print(f"  Sample {i}: {txt[:180]}")
    return selectors


def extract_card_data(page, card) -> dict[str, Any]:
    root = card
    text = safe_text(root)
    html = root.evaluate("el => el.outerHTML") if root else None

    result: dict[str, Any] = {
        "selector": None,
        "flight_number": None,
        "airline": None,
        "departure_airport": None,
        "departure_time": None,
        "arrival_airport": None,
        "arrival_time": None,
        "duration": None,
        "stops": None,
        "displayed_total_fare": None,
        "fare_breakdown_present": None,
        "fare_breakdown": None,
        "raw_text_excerpt": (text[:700] if text else None),
        "html_snippet": (html[:2000] if html else None),
        "available_fields": [],
    }

    if not root:
        return result

    locators = {
        "flight_number": [
            "text=/6E|AI|IX|SG|G8|9W|I5|UK|NQ|2T/i",
            "[data-testid*='flight-number']",
            "[data-test*='flight-number']",
            ".flight-number",
            ".flightNo",
            ".flight-no",
            "[aria-label*='flight number' i]",
        ],
        "airline": [
            "[data-testid*='airline']",
            "[data-test*='airline']",
            ".airline",
            "[data-testid*='carrier']",
            ".carrier",
        ],
        "departure_airport": [
            "[data-testid*='from']",
            "[data-test*='from']",
            ".from-airport",
            ".departure-airport",
        ],
        "departure_time": [
            "[data-testid*='departure-time']",
            "[data-test*='departure-time']",
            ".departure-time",
            ".time-departure",
        ],
        "arrival_airport": [
            "[data-testid*='to']",
            "[data-test*='to']",
            ".to-airport",
            ".arrival-airport",
        ],
        "arrival_time": [
            "[data-testid*='arrival-time']",
            "[data-test*='arrival-time']",
            ".arrival-time",
            ".time-arrival",
        ],
        "duration": [
            "[data-testid*='duration']",
            "[data-test*='duration']",
            ".duration",
            ".flight-duration",
        ],
        "stops": [
            "[data-testid*='stops']",
            "[data-test*='stops']",
            ".stops",
            ".layover",
        ],
        "displayed_total_fare": [
            "[data-testid*='price']",
            "[data-test*='price']",
            "[data-testid*='fare']",
            "[data-test*='fare']",
            ".fare",
            ".price",
            ".total-fare",
        ],
    }

    for field, selectors in locators.items():
        found = None
        for selector in selectors:
            try:
                el = root.locator(selector).first
                if el.count() > 0:
                    found = safe_text(el)
                    break
            except Exception:
                pass
        if found:
            result[field] = found
            result["available_fields"].append(field)

    if result["flight_number"] is None:
        m = re.search(r"\b(?:6E|AI|IX|SG|G8|9W|I5|UK|NQ|2T)[ -]?\d+[A-Z0-9-]*\b", text or "", flags=re.I)
        if m:
            result["flight_number"] = m.group(0)
            result["available_fields"].append("flight_number")

    if result["airline"] is None:
        airline_match = re.search(r"\b(?:IndiGo|Air India|SpiceJet|Akasa Air|Vistara|GoAir)\b", text or "", flags=re.I)
        if airline_match:
            result["airline"] = airline_match.group(0)
            result["available_fields"].append("airline")

    fare_breakdown_text = None
    for selector in [
        "[data-testid*='fare-details']",
        "[data-test*='fare-details']",
        ".fare-details",
        ".fare-summary",
        ".price-breakdown",
        ".fare-breakdown",
    ]:
        try:
            loc = root.locator(selector)
            if loc.count() > 0:
                fare_breakdown_text = safe_text(loc.first)
                break
        except Exception:
            pass

    if fare_breakdown_text:
        result["fare_breakdown_present"] = True
        result["fare_breakdown"] = fare_breakdown_text[:1500]
        result["available_fields"].append("fare_breakdown")
    else:
        result["fare_breakdown_present"] = False
        result["fare_breakdown"] = None

    if result["displayed_total_fare"] is None:
        fare_match = re.search(r"₹\s*([0-9,]+(?:\.\d+)?)", text or "")
        if fare_match:
            result["displayed_total_fare"] = fare_match.group(0)
            result["available_fields"].append("displayed_total_fare")

    result["available_fields"] = sorted(set(result["available_fields"]))
    return result


def main():
    print("Starting IndiGo live inspection...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1600, "height": 1100}, locale="en-IN")
        try:
            page.goto(SITE_URL, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle", timeout=45000)

            if detect_blocking(page):
                print("BLOCKED: page shows bot protection or CAPTCHAs.")
                print(detect_blocking(page))
                page.screenshot(path=str(OUT_DIR / "indigo_blocked.png"), full_page=True)
                return

            # Try a direct search attempt using the actual search form if present.
            route_input_selectors = [
                "input[placeholder*='From' i]",
                "input[aria-label*='From' i]",
                "input[name*='origin' i]",
                "input[id*='origin' i]",
            ]
            to_selectors = [
                "input[placeholder*='To' i]",
                "input[aria-label*='To' i]",
                "input[name*='destination' i]",
                "input[id*='destination' i]",
            ]

            from_input = None
            for selector in route_input_selectors:
                loc = page.locator(selector)
                if loc.count() > 0:
                    from_input = loc.first
                    break
            if from_input:
                from_input.fill("DEL")
            to_input = None
            for selector in to_selectors:
                loc = page.locator(selector)
                if loc.count() > 0:
                    to_input = loc.first
                    break
            if to_input:
                to_input.fill("BOM")

            for button in [
                "button:has-text('Search')",
                "button:has-text('Book')",
                "button:has-text('Search Flight')",
                "button:has-text('Search Flights')",
                "button[type='submit']",
            ]:
                locator = page.locator(button)
                if locator.count() > 0:
                    try:
                        locator.first.click(timeout=30000)
                        break
                    except Exception:
                        pass

            page.wait_for_timeout(15000)
            if detect_blocking(page):
                print("BLOCKED after search attempt.")
                print(detect_blocking(page))
                page.screenshot(path=str(OUT_DIR / "indigo_blocked_after_search.png"), full_page=True)
                return

            page.screenshot(path=str(OUT_DIR / "indigo_results.png"), full_page=True)

            candidate_selectors = find_candidate_cards(page)
            cards = []
            card_sel = None
            for selector in candidate_selectors:
                loc = page.locator(selector)
                count = loc.count()
                if count > 0:
                    for idx in range(min(count, 10)):
                        node = loc.nth(idx)
                        txt = safe_text(node)
                        if txt and any(token in (txt.upper()) for token in ["DEL", "BOM", "INDIGO", "6E"]):
                            cards.append(node)
                            card_sel = selector
                            break
                    if cards:
                        break

            print(f"\nFound candidate flight cards through selector: {card_sel!r}, count={len(cards)}")
            if not cards:
                print("No flight cards matched the likely selectors on the live page.")
                full_text = (page.locator("body").inner_text() or "")[:4000]
                print(full_text)
                return

            for idx, card in enumerate(cards[:3], start=1):
                data = extract_card_data(page, card)
                print_json(f"Example flight {idx}", data)

            # Print HTML snippet for the first complete card
            first_card = cards[0]
            first_html = first_card.evaluate("el => el.outerHTML")
            print("\n=== FIRST CARD HTML SNIPPET ===")
            print(first_html[:5000])

            browser.close()
        except Exception as exc:
            print(f"Live inspection failed: {exc}")
            try:
                page.screenshot(path=str(OUT_DIR / "indigo_exception.png"), full_page=True)
            except Exception:
                pass
            raise


if __name__ == "__main__":
    main()
