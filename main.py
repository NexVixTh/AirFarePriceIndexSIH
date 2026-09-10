from __future__ import annotations

import argparse
import os
from datetime import date, datetime, timedelta, timezone
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Path
from sqlalchemy import select, func
from pydantic import BaseModel

from db.models import CPIReference, FareQuote
from db.session import create_database_session, get_database_session, get_database_url
from pipeline.cpi_reference import fetch_official_cpi_transport, load_cached_transport_cpi
from pipeline.index_calculator import calculate_airfare_index, get_route_statistics, get_airline_statistics
from pipeline.data_cleaning import DataValidator, OutlierDetector, DuplicateDetector, DataQualityScorer
from pipeline.multi_window_tracker import MultiWindowTracker
from pipeline.dgca_integration import DGCADataProvider
from pipeline.scheduler import get_scheduler
from scrapers.indigo_scraper import IndigoScraper
from scrapers.goibibo_scraper import GoibiboScraper
from scrapers.airindia_scraper import AirIndiaScraper
from scrapers.airindiaexpress_scraper import AirIndiaExpressScraper
from scrapers.spicejet_scraper import SpiceJetScraper
from scrapers.makemytrip_scraper import MakeMyTripScraper
from scrapers.cleartrip_scraper import CleartripScraper
from fastapi.middleware.cors import CORSMiddleware


import ngrok

def connect_ngrok():
    forwarder = ngrok.forward("localhost:8085", authtoken_from_env=True, domain="iodine-unsterile-groom.ngrok-free.dev")
    print(f"Available at: {forwarder.url()}")

connect_ngrok()

app = FastAPI(
    title="Airfare Price Index (APIx)",
    description="Real-time airfare price index for India using automated web scraping",
    version="1.0.0"
)

# Enable CORS for local dev and frontend deployment
cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()] if cors_origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for responses
class FareQuoteResponse(BaseModel):
    id: int
    origin: str
    destination: str
    carrier: str
    source_site: str
    departure_date: date
    advance_purchase_days: int
    fare_class: str | None
    base_fare: float | None
    taxes_fees: float | None
    total_fare: float
    is_available: bool
    
    class Config:
        from_attributes = True


class IndexResponse(BaseModel):
    national_index: float | None
    base_period: str
    current_period: str
    route_indices: dict[str, float]
    airline_indices: dict[str, float]
    timestamp: datetime


class RouteStatisticsResponse(BaseModel):
    route: str
    min_fare: float
    max_fare: float
    mean_fare: float
    median_fare: float
    std_dev: float
    sample_size: int
    update_count: int


class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the APIx scraper and API server")
    parser.add_argument("--origin", default=os.getenv("DEFAULT_ORIGIN", "DEL"), help="IATA origin code")
    parser.add_argument("--destination", default=os.getenv("DEFAULT_DESTINATION", "BOM"), help="IATA destination code")
    parser.add_argument("--date", default=os.getenv("DEFAULT_DEPARTURE_DATE"), help="Departure date (YYYY-MM-DD)")
    parser.add_argument("--scraper", default="indigo", choices=["indigo", "goibibo", "all"], help="Which scraper to run")
    return parser.parse_args()


def persist_quotes(quotes: list[FareQuote]) -> None:
    if not quotes:
        return
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


def get_session():
    return create_database_session(get_database_url())


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Health check endpoint to verify API and database connectivity."""
    db_status = "ok"
    try:
        session = get_session()
        session.execute(select(func.count()).select_from(FareQuote))
        session.close()
    except Exception as exc:
        db_status = f"error: {str(exc)[:50]}"
    
    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        timestamp=datetime.now(timezone.utc)
    )


@app.get("/ready")
def readiness_check() -> dict[str, str]:
    """Readiness probe checking database and pipeline operational readiness."""
    try:
        session = get_session()
        session.execute(select(func.count()).select_from(FareQuote))
        session.close()
        return {"status": "ready", "service": "apix-api", "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database not ready: {exc}") from exc


@app.get("/api/v1/health", response_model=HealthResponse)
def v1_health_check() -> HealthResponse:
    return health_check()


@app.get("/api/v1/ready")
def v1_readiness_check() -> dict[str, str]:
    return readiness_check()


@app.get("/cpi/official", response_model=dict)
def official_cpi_transport() -> dict[str, Any]:
    """Fetch official Transport & Communication CPI from MoSPI."""
    try:
        payload = fetch_official_cpi_transport(force_refresh=False)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return payload


@app.get("/fares", response_model=list[FareQuoteResponse])
def get_fares(
    origin: str | None = Query(None, description="Origin IATA code"),
    destination: str | None = Query(None, description="Destination IATA code"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
) -> list[FareQuoteResponse]:
    """Retrieve fare quotes with optional filtering by route."""
    session = get_session()
    try:
        query = select(FareQuote).order_by(FareQuote.scrape_timestamp.desc())
        
        if origin:
            query = query.where(FareQuote.origin == origin.upper())
        if destination:
            query = query.where(FareQuote.destination == destination.upper())
        
        query = query.limit(limit).offset(offset)
        quotes = session.execute(query).scalars().all()
        return quotes
    finally:
        session.close()


@app.get("/fares/route/{origin}/{destination}", response_model=list[FareQuoteResponse])
def get_fares_by_route(
    origin: str,
    destination: str,
    days: int = Query(7, ge=1, le=90, description="Last N days of data"),
) -> list[FareQuoteResponse]:
    """Retrieve fare quotes for a specific route."""
    session = get_session()
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            select(FareQuote)
            .where(FareQuote.origin == origin.upper())
            .where(FareQuote.destination == destination.upper())
            .where(FareQuote.scrape_timestamp >= cutoff_date)
            .order_by(FareQuote.scrape_timestamp.desc())
            .limit(1000)
        )
        quotes = session.execute(query).scalars().all()
        return quotes
    finally:
        session.close()


@app.get("/index", response_model=IndexResponse)
def get_airfare_index(
    base_period: str = Query("2024-01", description="Base period (YYYY-MM) for index calculation"),
) -> IndexResponse:
    """Calculate and return the current Airfare Price Index."""
    try:
        session = get_session()
        index_data = calculate_airfare_index(session, base_period)
        session.close()
        return IndexResponse(
            national_index=index_data.get("national_index"),
            base_period=base_period,
            current_period=datetime.now(timezone.utc).strftime("%Y-%m"),
            route_indices=index_data.get("route_indices", {}),
            airline_indices=index_data.get("airline_indices", {}),
            timestamp=datetime.now(timezone.utc)
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Index calculation failed: {str(exc)}") from exc


@app.get("/index/history")
def get_index_history_endpoint(limit: int = Query(30, ge=1, le=365)) -> list[dict[str, Any]]:
    """Retrieve historical snapshots of the Airfare Price Index."""
    session = get_session()
    try:
        from pipeline.index_calculator import get_index_history
        return get_index_history(session, limit=limit)
    finally:
        session.close()


@app.post("/index/snapshot")
def create_index_snapshot_endpoint(base_period: str = Query("2024-01")) -> dict[str, Any]:
    """Calculate and persist current index snapshot into the index_history table."""
    session = get_session()
    try:
        from pipeline.index_calculator import calculate_airfare_index, save_index_snapshot
        index_data = calculate_airfare_index(session, base_period=base_period)
        record = save_index_snapshot(session, index_data)
        return {
            "status": "success",
            "snapshot_id": record.id,
            "national_index": record.national_index,
            "calculated_at": record.calculated_at.isoformat(),
        }
    finally:
        session.close()


@app.get("/anomalies")
def get_anomalies_endpoint(
    route: str | None = Query(None, description="Optional route filter (e.g. DEL-BOM)"),
    limit: int = Query(50, ge=1, le=500),
) -> list[dict[str, Any]]:
    """Retrieve recorded price anomalies and surge alerts."""
    session = get_session()
    try:
        from db.models import AnomalyRecord
        query = select(AnomalyRecord).order_by(AnomalyRecord.detected_at.desc())
        if route:
            query = query.where(AnomalyRecord.route == route.upper())
        query = query.limit(limit)
        records = session.execute(query).scalars().all()
        return [
            {
                "id": r.id,
                "detected_at": r.detected_at.isoformat(),
                "route": r.route,
                "carrier": r.carrier,
                "fare": r.fare,
                "baseline_fare": r.baseline_fare,
                "spike_percent": r.spike_percent,
                "severity": r.severity,
                "anomaly_type": r.anomaly_type,
                "status": r.status,
                "notes": r.notes,
            }
            for r in records
        ]
    finally:
        session.close()


@app.get("/scraper-logs")
def get_scraper_logs_endpoint(limit: int = Query(50, ge=1, le=200)) -> list[dict[str, Any]]:
    """Retrieve execution logs for automated scrapers."""
    session = get_session()
    try:
        from db.models import ScraperJobLog
        query = select(ScraperJobLog).order_by(ScraperJobLog.started_at.desc()).limit(limit)
        records = session.execute(query).scalars().all()
        return [
            {
                "id": r.id,
                "scraper_name": r.scraper_name,
                "route": r.route,
                "advance_days": r.advance_days,
                "started_at": r.started_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "status": r.status,
                "quotes_collected": r.quotes_collected,
                "error_message": r.error_message,
            }
            for r in records
        ]
    finally:
        session.close()


@app.get("/route-stats/{origin}/{destination}", response_model=RouteStatisticsResponse)
def get_route_stats(origin: str, destination: str) -> RouteStatisticsResponse:
    """Get statistical summary for a route (min, max, mean, std dev)."""
    try:
        session = get_session()
        stats = get_route_statistics(session, origin.upper(), destination.upper())
        session.close()
        if not stats:
            raise HTTPException(status_code=404, detail=f"No data found for route {origin}-{destination}")
        return RouteStatisticsResponse(**stats)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/airline-stats/{carrier}", response_model=dict)
def get_airline_stats(carrier: str) -> dict[str, Any]:
    """Get statistical summary for an airline across all routes."""
    try:
        session = get_session()
        stats = get_airline_statistics(session, carrier.upper())
        session.close()
        if not stats:
            raise HTTPException(status_code=404, detail=f"No data found for carrier {carrier}")
        return stats
    finally:
        session.close()


@app.get("/routes", response_model=list[dict])
def get_active_routes() -> list[dict[str, Any]]:
    """Get list of all active routes with recent data."""
    session = get_session()
    try:
        query = (
            select(FareQuote.origin, FareQuote.destination, func.count().label("quote_count"))
            .group_by(FareQuote.origin, FareQuote.destination)
            .order_by(func.count().desc())
            .limit(100)
        )
        results = session.execute(query).all()
        return [
            {"origin": row[0], "destination": row[1], "quote_count": row[2]}
            for row in results
        ]
    finally:
        session.close()


@app.post("/scrape/{scraper_type}")
def trigger_scrape(
    scraper_type: str = Path(..., description="indigo or goibibo"),
    origin: str = Query("DEL"),
    destination: str = Query("BOM"),
    days_ahead: int = Query(7, ge=1, le=90),
) -> dict[str, Any]:
    """Manually trigger a scraping job."""
    try:
        if scraper_type.lower() == "indigo":
            departure_date = (datetime.now(timezone.utc).date() + timedelta(days=days_ahead)).isoformat()
            scraper = IndigoScraper(origin=origin, destination=destination, departure_date=departure_date)
        elif scraper_type.lower() == "goibibo":
            departure_date = (datetime.now(timezone.utc).date() + timedelta(days=days_ahead)).isoformat()
            scraper = GoibiboScraper(origin=origin, destination=destination, departure_date=departure_date)
        else:
            raise ValueError(f"Unknown scraper: {scraper_type}")
        
        quotes = scraper.run()
        persist_quotes(quotes)
        
        return {
            "status": "success",
            "scraper": scraper_type,
            "route": f"{origin}-{destination}",
            "quotes_extracted": len(quotes),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(exc)}") from exc


def main() -> None:
    args = parse_args()
    departure_date = args.date or (datetime.now(timezone.utc).date() + timedelta(days=7)).isoformat()
    
    scrapers_to_run = []
    if args.scraper in ("indigo", "all"):
        scrapers_to_run.append(("IndiGo", IndigoScraper(origin=args.origin, destination=args.destination, departure_date=departure_date)))
    if args.scraper in ("goibibo", "all"):
        scrapers_to_run.append(("Goibibo", GoibiboScraper(origin=args.origin, destination=args.destination, departure_date=departure_date)))
    
    for scraper_name, scraper in scrapers_to_run:
        print(f"\nRunning {scraper_name} scraper for {args.origin}-{args.destination}...")
        try:
            quotes = scraper.run()
            if quotes:
                persist_quotes(quotes)
            else:
                print(f"No quotes found for {scraper_name}")
        except Exception as exc:
            print(f"Error running {scraper_name}: {exc}")


@app.get("/multi-window-analysis/{origin}/{destination}")
def get_multi_window_analysis(origin: str, destination: str) -> dict[str, Any]:
    """Get multi-window price analysis across advance-purchase windows (T+1,7,15,30,45)."""
    try:
        session = get_session()
        from pipeline.multi_window_tracker import MultiWindowTracker
        analysis = MultiWindowTracker.track_route_across_windows(session, origin.upper(), destination.upper())
        session.close()
        return analysis
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/lead-time-elasticity/{origin}/{destination}")
def get_elasticity_curve(origin: str, destination: str) -> dict[str, Any]:
    """Get lead-time elasticity curve for price forecasting."""
    try:
        session = get_session()
        from pipeline.multi_window_tracker import MultiWindowTracker
        curve = MultiWindowTracker.get_lead_time_elasticity_curve(session, origin.upper(), destination.upper())
        session.close()
        return curve
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/data-quality-report")
def get_data_quality_report() -> dict[str, Any]:
    """Get comprehensive data quality report."""
    try:
        session = get_session()
        from pipeline.data_cleaning import DataQualityScorer
        report = DataQualityScorer.get_system_quality_report(session)
        session.close()
        return report
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/route-quality/{origin}/{destination}")
def get_route_quality(origin: str, destination: str) -> dict[str, float]:
    """Get data quality score for a specific route."""
    try:
        session = get_session()
        from pipeline.data_cleaning import DataQualityScorer
        quality = DataQualityScorer.calculate_route_quality(session, origin.upper(), destination.upper())
        session.close()
        return {"route": f"{origin}-{destination}", "quality_score": quality}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/outlier-detection/{origin}/{destination}")
def detect_outliers(origin: str, destination: str) -> dict[str, Any]:
    """Detect statistical outliers for a route."""
    try:
        session = get_session()
        from pipeline.data_cleaning import OutlierDetector
        outliers = OutlierDetector.detect_route_outliers(session, origin.upper(), destination.upper())
        session.close()
        return outliers
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/dgca-validation")
def dgca_validation_report(period: str = Query("2024-09")) -> dict[str, Any]:
    """Get DGCA validation report comparing our index with official data."""
    try:
        session = get_session()
        index_data = calculate_airfare_index(session, base_period="2024-01")
        session.close()
        
        from pipeline.dgca_integration import DGCADataProvider
        validation = DGCADataProvider.validate_index_against_dgca(index_data["national_index"], period)
        return validation
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/dgca-methodology")
def methodology_report() -> dict[str, Any]:
    """Get detailed methodology report aligned with DGCA guidelines."""
    from pipeline.dgca_integration import DGCADataProvider
    return DGCADataProvider.generate_index_methodology_report()


@app.get("/priority-routes")
def get_priority_routes() -> dict[str, Any]:
    """Get priority routes for scraping based on DGCA passenger traffic."""
    from pipeline.dgca_integration import DGCADataProvider
    routes = DGCADataProvider.get_priority_routes()
    return {
        "priority_routes": [f"{o}-{d}" for o, d in routes],
        "source": "DGCA Passenger Traffic Data",
        "basis": "Monthly passenger volume statistics",
    }


@app.get("/scheduler-stats")
def scheduler_statistics() -> dict[str, Any]:
    """Get scraping scheduler statistics."""
    from pipeline.scheduler import get_scheduler
    scheduler = get_scheduler()
    return scheduler.get_stats()


@app.post("/scheduler/start")
def start_scheduler(hour: int = Query(8, ge=0, le=23)) -> dict[str, str]:
    """Start the automated daily scraping scheduler."""
    try:
        from pipeline.scheduler import get_scheduler
        scheduler = get_scheduler()
        scheduler.schedule_daily_scraping(hour=hour)
        scheduler.start()
        return {
            "status": "success",
            "message": f"Scheduler started for daily scraping at {hour:02d}:00",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/scheduler/stop")
def stop_scheduler() -> dict[str, str]:
    """Stop the automated scraping scheduler."""
    try:
        from pipeline.scheduler import get_scheduler
        scheduler = get_scheduler()
        scheduler.stop()
        return {"status": "success", "message": "Scheduler stopped"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/run-batch-scrape")
def run_batch_scrape() -> dict[str, Any]:
    """Manually trigger complete batch scraping job."""
    try:
        from pipeline.scheduler import get_scheduler
        scheduler = get_scheduler()
        results = scheduler.run_daily_scraping()
        return results
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Batch scrape failed: {str(exc)}") from exc


if __name__ == "__main__":
    import sys
    # Check if running as API server or CLI
    if len(sys.argv) > 1 and sys.argv[1] in ("--origin", "--destination", "--date", "--scraper"):
        # CLI mode: run scraper
        main()
    else:
        # API server mode
        uvicorn.run("main:app", host="0.0.0.0", port=5000, log_level="info")
