from __future__ import annotations

import json
import os
import ssl
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context
from sqlalchemy import select

from db.models import CPIReference
from db.session import create_database_session, get_database_url


OFFICIAL_CPI_GROUP_NAME = "Transport and Communication"
OFFICIAL_CPI_URL = "https://api.mospi.gov.in/api/cpi/getCPIIndex"
CACHE_PATH = Path(__file__).resolve().parent / "cpi_reference_cache.json"

MONTH_MAP = {
    "january": "01",
    "february": "02",
    "march": "03",
    "april": "04",
    "may": "05",
    "june": "06",
    "july": "07",
    "august": "08",
    "september": "09",
    "october": "10",
    "november": "11",
    "december": "12",
}


class LegacySSLAdapter(HTTPAdapter):
    """Custom HTTPAdapter enabling OP_LEGACY_SERVER_CONNECT for older government SSL endpoints."""

    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4)
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)


def _get_mospi_session() -> requests.Session:
    session = requests.Session()
    session.mount("https://", LegacySSLAdapter())
    return session


def _error_message_from_response(response: requests.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            detail = payload.get("message") or payload.get("error") or payload.get("detail") or payload.get("msg")
            if detail:
                return str(detail)
    except ValueError:
        pass
    text = response.text.strip()
    if text:
        return text[:500]
    return f"HTTP {response.status_code} from MoSPI CPI API"


def _load_cache() -> list[dict[str, Any]]:
    if not CACHE_PATH.exists():
        return []
    try:
        with CACHE_PATH.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, list):
            return data
    except (OSError, ValueError):
        pass
    return []


def _write_cache(rows: list[dict[str, Any]]) -> None:
    try:
        with CACHE_PATH.open("w", encoding="utf-8") as fh:
            json.dump(rows, fh, ensure_ascii=False, indent=2)
    except OSError:
        pass


def _persist_rows(rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    session = create_database_session(get_database_url())
    try:
        for row in rows:
            session.merge(
                CPIReference(
                    period=row["period"],
                    sub_group=row.get("sub_group", OFFICIAL_CPI_GROUP_NAME),
                    index_value=row.get("index_value"),
                    inflation_rate=row.get("inflation_rate"),
                    fetched_at=datetime.now(timezone.utc),
                    source=row.get("source", "MoSPI CPI API"),
                )
            )
        session.commit()
    except Exception as exc:
        session.rollback()
        # Non-fatal if DB is unreachable during testing
        print(f"Warning: Could not persist CPI rows to DB: {exc}")
    finally:
        session.close()


def _normalize_mospi_payload(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        rows = data.get("data") or data.get("result") or data.get("rows") or []
    else:
        rows = []

    normalized: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        
        # Parse period from year/month or direct period field
        year = str(row.get("year", "")).strip()
        month_raw = str(row.get("month", "")).strip()
        month_num = MONTH_MAP.get(month_raw.lower(), month_raw)
        
        period = row.get("period")
        if not period and year and month_num:
            period = f"{year}-{month_num.zfill(2)}"
        elif not period:
            period = row.get("date")

        if not period:
            continue

        raw_index = row.get("index") or row.get("index_value") or row.get("value")
        raw_inflation = row.get("inflation") or row.get("inflation_rate") or row.get("growth_rate")

        index_value = float(raw_index) if raw_index not in (None, "", "N/A") else None
        inflation_rate = float(raw_inflation) if raw_inflation not in (None, "", "N/A") else None

        sub_group = (
            row.get("subgroup")
            or row.get("sub_group")
            or row.get("group_name")
            or OFFICIAL_CPI_GROUP_NAME
        )

        normalized.append(
            {
                "period": str(period),
                "sub_group": sub_group,
                "index_value": index_value,
                "inflation_rate": inflation_rate,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "source": "MoSPI CPI API",
            }
        )
    return normalized


def _fetch_with_fallback() -> list[dict[str, Any]]:
    session = _get_mospi_session()
    all_rows: list[dict[str, Any]] = []
    years_to_fetch = [2024, 2023]

    for year in years_to_fetch:
        params = {
            "base_year": "2012",
            "series": "Current",
            "year": str(year),
            "subgroup_code": "6.1.03",  # Transport and Communication subgroup
            "sector_code": "3",         # Combined (Rural + Urban)
            "state_code": "99",         # All India
            "Format": "JSON",
        }
        try:
            response = session.get(OFFICIAL_CPI_URL, params=params, timeout=15, verify=False)
            if response.status_code == 200:
                payload = response.json()
                rows = _normalize_mospi_payload(payload)
                all_rows.extend(rows)
        except Exception:
            continue

    if not all_rows:
        # Fall back to checking cache
        cached = _load_cache()
        if cached:
            return cached
        raise RuntimeError("MoSPI CPI API request failed and no local cache is available.")

    # Deduplicate by period
    seen_periods: set[str] = set()
    deduped_rows: list[dict[str, Any]] = []
    for r in all_rows:
        if r["period"] not in seen_periods:
            seen_periods.add(r["period"])
            deduped_rows.append(r)

    return sorted(deduped_rows, key=lambda x: str(x["period"]))


def fetch_official_cpi_transport(force_refresh: bool = False) -> dict[str, Any]:
    """Fetch and cache the official CPI transport subgroup data."""
    cached_rows = _load_cache()
    if not force_refresh and cached_rows:
        records = cached_rows
    else:
        try:
            records = _fetch_with_fallback()
            _persist_rows(records)
            _write_cache(records)
        except Exception as exc:
            if cached_rows:
                records = cached_rows
            else:
                raise RuntimeError(f"MoSPI CPI API is unreachable: {exc}") from exc

    filtered = [row for row in records if str(row.get("sub_group", "")).lower() == OFFICIAL_CPI_GROUP_NAME.lower()]
    if not filtered:
        # If subgroup matching was exact, take all records
        filtered = records

    if not filtered:
        return {
            "status": "warning",
            "source": "MoSPI CPI API",
            "message": "No Transport and Communication rows were returned by the official MoSPI CPI data feed.",
            "data": [],
        }

    ordered = sorted(filtered, key=lambda row: str(row.get("period", "")))
    return {
        "status": "ok",
        "source": "MoSPI CPI API",
        "sub_group": OFFICIAL_CPI_GROUP_NAME,
        "data": ordered,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def load_cached_transport_cpi() -> list[dict[str, Any]]:
    rows = _load_cache()
    filtered = [row for row in rows if str(row.get("sub_group", "")).lower() == OFFICIAL_CPI_GROUP_NAME.lower()]
    return sorted(filtered or rows, key=lambda row: str(row.get("period", "")))
