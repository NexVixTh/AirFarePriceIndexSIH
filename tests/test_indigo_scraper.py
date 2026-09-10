from datetime import date

from scrapers.indigo_scraper import IndigoScraper


def test_indigo_target_site_and_no_fabricated_split():
    scraper = IndigoScraper(origin="DEL", destination="BOM", departure_date=date(2026, 9, 1))

    assert scraper._site_url() == "https://www.goindigo.in"
    assert "flight" in scraper.result_card_selector.lower()
    assert "fare" in scraper.fare_breakdown_selector.lower()

    breakdown = scraper._build_breakdown(total_fare=12345, base_fare=None, taxes_fees=None)
    assert breakdown["base_fare"] is None
    assert breakdown["taxes_fees"] is None
    assert breakdown["total_fare"] == 12345


def test_indigo_uses_card_scoped_selector_not_blind_dom_sweep():
    scraper = IndigoScraper(origin="DEL", destination="BOM", departure_date=date(2026, 9, 1))

    assert scraper.result_card_selector.startswith("[") or "flight" in scraper.result_card_selector.lower()
    assert "article" not in scraper.result_card_selector.lower()
    assert "div, li, article" not in scraper.result_card_selector.lower()
