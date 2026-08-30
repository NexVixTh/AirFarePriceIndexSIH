from __future__ import annotations

import argparse
import os

from dotenv import load_dotenv

from db.models import FareQuote
from db.session import create_database_session, get_database_url
from scrapers.goibibo_scraper import GoibiboScraper


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the APIx Goibibo scraper")
    parser.add_argument("--origin", default=os.getenv("DEFAULT_ORIGIN", "DEL"), help="IATA origin code")
    parser.add_argument("--destination", default=os.getenv("DEFAULT_DESTINATION", "BOM"), help="IATA destination code")
    parser.add_argument("--date", default=os.getenv("DEFAULT_DEPARTURE_DATE"), help="Departure date (YYYY-MM-DD)")
    return parser.parse_args()


def persist_quotes(quotes: list[FareQuote]) -> None:
    database_url = get_database_url()
    session = create_database_session(database_url)
    try:
        for quote in quotes:
            session.add(quote)
        session.commit()
        print(f"Saved {len(quotes)} fare quotes to PostgreSQL.")
    except Exception as exc:  # pragma: no cover - depends on local DB state.
        print(f"Unable to persist to PostgreSQL: {exc}")
    finally:
        session.close()


def main() -> None:
    load_dotenv()
    args = parse_args()
    scraper = GoibiboScraper(origin=args.origin, destination=args.destination, departure_date=args.date)
    quotes = scraper.run()

    if not quotes:
        print(f"No live fare offers were extracted for {args.origin}-{args.destination} on {scraper.departure_date.isoformat()}.")
        return

    persist_quotes(quotes)


if __name__ == "__main__":
    main()
