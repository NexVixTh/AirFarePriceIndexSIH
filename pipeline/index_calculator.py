"""
Index calculation module for computing the Airfare Price Index (APIx).

Implements CPI-style index methodology:
1. Fixed basket approach: pre-defined route x advance-booking-window combinations
2. Price relatives: current price vs. base period price for each basket item
3. Weighted aggregation: using CPI-style weighting by passenger traffic
"""

from __future__ import annotations

import statistics
from datetime import datetime, timezone, timedelta
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import select, func

import json
from db.models import FareQuote, IndexHistory, AnomalyRecord


# Base period reference fares (2024-01 baseline across 11 DGCA priority corridors)
BASE_PERIOD_FARES = {
    "DEL-BOM": 4500.0,  # Delhi-Mumbai
    "DEL-BLR": 5500.0,  # Delhi-Bangalore
    "BOM-BLR": 4000.0,  # Mumbai-Bangalore
    "DEL-CCU": 3500.0,  # Delhi-Kolkata
    "BLR-HYD": 3200.0,  # Bangalore-Hyderabad
    "MAA-DEL": 4800.0,  # Chennai-Delhi
    "PNQ-BOM": 2800.0,  # Pune-Mumbai
    "COK-DEL": 5200.0,  # Kochi-Delhi
    "MAA-BOM": 3800.0,  # Chennai-Mumbai
    "AMD-DEL": 3400.0,  # Ahmedabad-Delhi
    "DEL-HYD": 4100.0,  # Delhi-Hyderabad
}

# Route weights normalized to sum = 1.0 based on DGCA domestic passenger traffic
ROUTE_WEIGHTS = {
    "DEL-BOM": 0.180,
    "DEL-BLR": 0.145,
    "BOM-BLR": 0.125,
    "DEL-CCU": 0.095,
    "BLR-HYD": 0.085,
    "MAA-DEL": 0.080,
    "PNQ-BOM": 0.070,
    "COK-DEL": 0.065,
    "MAA-BOM": 0.055,
    "AMD-DEL": 0.050,
    "DEL-HYD": 0.050,
}

# Airline weights (based on market share - example)
AIRLINE_WEIGHTS = {
    "6E": 0.25,  # IndiGo
    "AI": 0.20,  # Air India
    "SG": 0.15,  # SpiceJet
    "G8": 0.15,  # Go Air
    "IX": 0.10,  # Air India Express
    "UK": 0.10,  # Vistara
    "9W": 0.05,  # Jet Airways
}


def get_route_statistics(session: Session, origin: str, destination: str) -> dict[str, Any] | None:
    """
    Calculate statistical summary for a specific route.
    
    Returns: {
        "route": "DEL-BOM",
        "min_fare": 3200,
        "max_fare": 8500,
        "mean_fare": 5234.5,
        "median_fare": 5100,
        "std_dev": 1234.5,
        "sample_size": 45,
        "update_count": 12
    }
    """
    # Get all fares for this route in the last 7 days
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    query = (
        select(FareQuote.total_fare)
        .where(FareQuote.origin == origin)
        .where(FareQuote.destination == destination)
        .where(FareQuote.scrape_timestamp >= cutoff)
    )
    
    fares = [row[0] for row in session.execute(query).all()]
    
    if not fares:
        return None
    
    fares_sorted = sorted(fares)
    
    return {
        "route": f"{origin}-{destination}",
        "min_fare": min(fares),
        "max_fare": max(fares),
        "mean_fare": statistics.mean(fares),
        "median_fare": statistics.median(fares),
        "std_dev": statistics.stdev(fares) if len(fares) > 1 else 0.0,
        "sample_size": len(fares),
        "update_count": session.execute(
            select(func.count(FareQuote.id))
            .where(FareQuote.origin == origin)
            .where(FareQuote.destination == destination)
            .where(FareQuote.scrape_timestamp >= cutoff)
        ).scalar() or 0
    }


def get_airline_statistics(session: Session, carrier: str) -> dict[str, Any] | None:
    """
    Calculate statistical summary for an airline across all routes.
    
    Returns aggregate statistics on mean fares, route coverage, etc.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    query = (
        select(FareQuote.total_fare)
        .where(FareQuote.carrier == carrier)
        .where(FareQuote.scrape_timestamp >= cutoff)
    )
    
    fares = [row[0] for row in session.execute(query).all()]
    
    if not fares:
        return None
    
    # Get route coverage
    route_query = (
        select(FareQuote.origin, FareQuote.destination)
        .where(FareQuote.carrier == carrier)
        .where(FareQuote.scrape_timestamp >= cutoff)
        .distinct()
    )
    
    routes = session.execute(route_query).all()
    
    return {
        "carrier": carrier,
        "mean_fare": statistics.mean(fares),
        "median_fare": statistics.median(fares),
        "min_fare": min(fares),
        "max_fare": max(fares),
        "std_dev": statistics.stdev(fares) if len(fares) > 1 else 0.0,
        "sample_count": len(fares),
        "route_count": len(routes),
        "routes": [f"{r[0]}-{r[1]}" for r in routes],
        "period_days": 7
    }


def calculate_price_relative(current_price: float, base_price: float) -> float:
    """
    Calculate price relative: ratio of current to base period price.
    
    Used in CPI methodology:
    - Price relative = (current_price / base_price) * 100
    - If base_price = 100, then relative shows percentage change
    """
    if base_price == 0:
        return 0.0
    return round((current_price / base_price) * 100.0, 4)


def calculate_airfare_index(session: Session, base_period: str = "2024-01") -> dict[str, Any]:
    """
    Calculate the national Airfare Price Index (APIx).
    
    Methodology:
    1. For each route in the basket, compute average current fare
    2. Calculate price relative vs. base period
    3. Aggregate route indices using CPI-style weighting
    4. Result: national index value (base = 100)
    
    Returns: {
        "national_index": 115.2,
        "route_indices": {"DEL-BOM": 112.5, ...},
        "airline_indices": {"6E": 114.2, ...},
        "coverage_percent": 95.5
    }
    """
    
    route_indices = {}
    route_prices = {}
    covered_routes = 0
    
    # Calculate index for each route
    for route, base_fare in BASE_PERIOD_FARES.items():
        origin, destination = route.split("-")
        
        # Get recent fares for this route (last 7 days)
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        query = (
            select(FareQuote.total_fare)
            .where(FareQuote.origin == origin)
            .where(FareQuote.destination == destination)
            .where(FareQuote.scrape_timestamp >= cutoff)
        )
        
        fares = [row[0] for row in session.execute(query).all()]
        
        if fares:
            avg_fare = statistics.mean(fares)
            route_prices[route] = avg_fare
            price_relative = calculate_price_relative(avg_fare, base_fare)
            route_indices[route] = price_relative
            covered_routes += 1
        else:
            # Use base fare as fallback if no recent data
            route_prices[route] = base_fare
            route_indices[route] = 100.0
    
    # Calculate weighted national index
    national_index = 0.0
    total_weight = 0.0
    
    for route, route_index in route_indices.items():
        weight = ROUTE_WEIGHTS.get(route, 0.05)  # Default 5% weight
        national_index += route_index * weight
        total_weight += weight
    
    # Normalize
    if total_weight > 0:
        national_index = national_index / total_weight
    else:
        national_index = 100.0
    
    # Calculate airline indices
    airline_indices = {}
    for carrier, carrier_weight in AIRLINE_WEIGHTS.items():
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        query = (
            select(FareQuote.total_fare)
            .where(FareQuote.carrier == carrier)
            .where(FareQuote.scrape_timestamp >= cutoff)
        )
        
        fares = [row[0] for row in session.execute(query).all()]
        
        if fares:
            avg_fare = statistics.mean(fares)
            # Use a weighted average of base fares as reference
            reference_fare = statistics.mean(BASE_PERIOD_FARES.values())
            airline_indices[carrier] = calculate_price_relative(avg_fare, reference_fare)
        else:
            airline_indices[carrier] = 100.0
    
    coverage_percent = (covered_routes / len(BASE_PERIOD_FARES)) * 100.0
    
    return {
        "national_index": round(national_index, 2),
        "base_period": base_period,
        "current_period": datetime.now(timezone.utc).strftime("%Y-%m"),
        "route_indices": {k: round(v, 2) for k, v in route_indices.items()},
        "airline_indices": {k: round(v, 2) for k, v in airline_indices.items()},
        "coverage_percent": round(coverage_percent, 1),
        "routes_covered": covered_routes,
        "total_routes_in_basket": len(BASE_PERIOD_FARES),
        "calculation_timestamp": datetime.now(timezone.utc).isoformat()
    }


def detect_anomalies(session: Session, route: str, threshold_percent: float = 30.0) -> list[dict[str, Any]]:
    """
    Detect anomalous price spikes in a route.
    
    Returns list of anomalies (dates when price exceeded mean + threshold%).
    """
    origin, destination = route.split("-")
    
    # Get all recent fares for this route
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    query = (
        select(FareQuote.total_fare, FareQuote.scrape_timestamp)
        .where(FareQuote.origin == origin)
        .where(FareQuote.destination == destination)
        .where(FareQuote.scrape_timestamp >= cutoff)
        .order_by(FareQuote.scrape_timestamp)
    )
    
    records = session.execute(query).all()
    
    if len(records) < 5:
        return []
    
    fares = [r[0] for r in records]
    mean_fare = statistics.mean(fares)
    threshold = mean_fare * (1 + threshold_percent / 100.0)
    
    anomalies = []
    for fare, timestamp in records:
        if fare > threshold:
            anomalies.append({
                "route": route,
                "fare": fare,
                "mean_fare": mean_fare,
                "threshold": threshold,
                "spike_percent": ((fare - mean_fare) / mean_fare) * 100.0,
                "timestamp": timestamp.isoformat()
            })
    
    return anomalies


def save_index_snapshot(session: Session, index_data: dict[str, Any]) -> IndexHistory:
    """Persist an index calculation snapshot into the index_history table."""
    history = IndexHistory(
        calculated_at=datetime.now(timezone.utc),
        base_period=index_data.get("base_period", "2024-01"),
        current_period=index_data.get("current_period", datetime.now(timezone.utc).strftime("%Y-%m")),
        national_index=float(index_data.get("national_index", 100.0)),
        coverage_percent=float(index_data.get("coverage_percent", 0.0)),
        routes_covered=int(index_data.get("routes_covered", 0)),
        total_routes_in_basket=int(index_data.get("total_routes_in_basket", len(BASE_PERIOD_FARES))),
        route_indices_json=json.dumps(index_data.get("route_indices", {})),
        airline_indices_json=json.dumps(index_data.get("airline_indices", {})),
        methodology="Weighted Jevons / Laspeyres",
    )
    session.add(history)
    session.commit()
    return history


def get_index_history(session: Session, limit: int = 30) -> list[dict[str, Any]]:
    """Retrieve historical index snapshots."""
    query = (
        select(IndexHistory)
        .order_by(IndexHistory.calculated_at.desc())
        .limit(limit)
    )
    records = session.execute(query).scalars().all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "calculated_at": r.calculated_at.isoformat(),
            "base_period": r.base_period,
            "current_period": r.current_period,
            "national_index": r.national_index,
            "coverage_percent": r.coverage_percent,
            "routes_covered": r.routes_covered,
            "total_routes_in_basket": r.total_routes_in_basket,
            "route_indices": json.loads(r.route_indices_json or "{}"),
            "airline_indices": json.loads(r.airline_indices_json or "{}"),
            "methodology": r.methodology,
        })
    return list(reversed(results))  # Chronological order


def record_anomalies(session: Session, anomalies: list[dict[str, Any]]) -> int:
    """Persist detected anomaly records to the anomaly_records table."""
    count = 0
    for a in anomalies:
        spike = float(a.get("spike_percent", 0.0))
        severity = "CRITICAL" if spike > 75 else "HIGH" if spike > 50 else "MEDIUM"
        record = AnomalyRecord(
            detected_at=datetime.now(timezone.utc),
            route=a.get("route", "UNKNOWN"),
            carrier=a.get("carrier"),
            fare=float(a.get("fare", 0.0)),
            baseline_fare=float(a.get("mean_fare", 0.0)),
            spike_percent=round(spike, 2),
            severity=severity,
            anomaly_type="PRICE_SURGE",
            status="ACTIVE",
            notes=f"Price spike of {spike:.1f}% detected over baseline {a.get('mean_fare', 0):.0f}",
        )
        session.add(record)
        count += 1
    if count > 0:
        session.commit()
    return count
