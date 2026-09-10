"""
Advanced Data Cleaning & Validation Pipeline

Implements:
- Outlier detection using IQR method
- Statistical validation
- Missing value handling
- Data quality scoring
- Tax/fee validation
- Duplicate detection
"""

from __future__ import annotations

import statistics
from datetime import datetime, timezone, timedelta
from typing import Any

import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select

from db.models import FareQuote


class DataValidator:
    """Validates and cleans fare quote data."""
    
    # Valid fare range (INR)
    MIN_FARE = 500
    MAX_FARE = 500000
    
    # Valid tax percentage range
    MIN_TAX_PERCENT = 5
    MAX_TAX_PERCENT = 50
    
    # IATA airport codes (sample)
    VALID_AIRPORT_CODES = {
        "DEL", "BOM", "BLR", "CCU", "HYD", "MAA", "COK", "AMD",
        "PNQ", "VTZ", "BBI", "GAY", "IDR", "LKO", "JDH", "JIB",
        "NAG", "SXR", "TRV", "GOI", "RJD", "PAT", "STV", "AGX",
    }
    
    # IATA airline codes (sample)
    VALID_CARRIERS = {"6E", "AI", "IX", "SG", "G8", "9W", "I5", "UK", "NQ", "2T", "BA", "LH", "AF", "QF", "CX"}
    
    @staticmethod
    def is_valid_fare_range(fare: float) -> bool:
        """Check if fare is within valid range."""
        return DataValidator.MIN_FARE <= fare <= DataValidator.MAX_FARE
    
    @staticmethod
    def is_valid_airport_code(code: str) -> bool:
        """Check if airport code is valid."""
        return code.upper() in DataValidator.VALID_AIRPORT_CODES or len(code) == 3
    
    @staticmethod
    def is_valid_carrier(carrier: str) -> bool:
        """Check if carrier code is valid."""
        return carrier.upper() in DataValidator.VALID_CARRIERS
    
    @staticmethod
    def validate_tax_fees(total_fare: float, base_fare: float, taxes_fees: float) -> bool:
        """Validate tax and fees are reasonable."""
        if total_fare <= 0 or base_fare is None or taxes_fees is None:
            return True  # Can't validate, but not invalid
        
        if abs(total_fare - (base_fare + taxes_fees)) > 1:  # Allow 1 paisa rounding error
            return False
        
        tax_percent = (taxes_fees / total_fare) * 100
        return DataValidator.MIN_TAX_PERCENT <= tax_percent <= DataValidator.MAX_TAX_PERCENT
    
    @staticmethod
    def validate_quote(quote: FareQuote) -> tuple[bool, str]:
        """
        Validate a fare quote.
        
        Returns: (is_valid, error_message)
        """
        if not DataValidator.is_valid_airport_code(quote.origin):
            return False, f"Invalid origin code: {quote.origin}"
        
        if not DataValidator.is_valid_airport_code(quote.destination):
            return False, f"Invalid destination code: {quote.destination}"
        
        if quote.origin == quote.destination:
            return False, "Origin and destination are the same"
        
        if not DataValidator.is_valid_fare_range(quote.total_fare):
            return False, f"Fare out of range: {quote.total_fare}"
        
        if quote.base_fare and quote.taxes_fees:
            if not DataValidator.validate_tax_fees(quote.total_fare, quote.base_fare, quote.taxes_fees):
                return False, f"Invalid tax/fee breakdown for fare {quote.total_fare}"
        
        if quote.advance_purchase_days < 0:
            return False, "Negative advance purchase days"
        
        if quote.departure_date < datetime.now(timezone.utc).date():
            return False, "Departure date is in the past"
        
        return True, ""


class OutlierDetector:
    """Detects statistical outliers using IQR method."""
    
    @staticmethod
    def detect_outliers(fares: list[float], iqr_multiplier: float = 1.5) -> tuple[list[float], list[float]]:
        """
        Detect outliers using Interquartile Range (IQR) method.
        
        Returns: (normal_fares, outlier_fares)
        """
        if len(fares) < 4:
            return fares, []
        
        fares_sorted = sorted(fares)
        q1 = np.percentile(fares_sorted, 25)
        q3 = np.percentile(fares_sorted, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - (iqr_multiplier * iqr)
        upper_bound = q3 + (iqr_multiplier * iqr)
        
        normal = [f for f in fares if lower_bound <= f <= upper_bound]
        outliers = [f for f in fares if f < lower_bound or f > upper_bound]
        
        return normal, outliers
    
    @staticmethod
    def detect_route_outliers(session: Session, origin: str, destination: str, iqr_multiplier: float = 1.5) -> dict[str, Any]:
        """Detect outliers for a specific route."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        query = (
            select(FareQuote.total_fare, FareQuote.id)
            .where(FareQuote.origin == origin)
            .where(FareQuote.destination == destination)
            .where(FareQuote.scrape_timestamp >= cutoff)
        )
        
        results = session.execute(query).all()
        
        if not results:
            return {"normal_quotes": [], "outlier_quotes": []}
        
        fares = [r[0] for r in results]
        quote_ids = [r[1] for r in results]
        
        normal_fares, outlier_fares = OutlierDetector.detect_outliers(fares, iqr_multiplier)
        
        outlier_ids = [quote_ids[i] for i, f in enumerate(fares) if f in outlier_fares]
        
        return {
            "normal_quotes": len(normal_fares),
            "outlier_quotes": len(outlier_fares),
            "outlier_ids": outlier_ids,
            "iqr_lower_bound": float(np.percentile(fares, 25) - (iqr_multiplier * (np.percentile(fares, 75) - np.percentile(fares, 25)))),
            "iqr_upper_bound": float(np.percentile(fares, 75) + (iqr_multiplier * (np.percentile(fares, 75) - np.percentile(fares, 25)))),
        }


class DuplicateDetector:
    """Detects and removes duplicate quotes."""
    
    @staticmethod
    def find_duplicates(session: Session, route: str, time_window_minutes: int = 30) -> list[tuple[int, int]]:
        """
        Find duplicate quotes within time window.
        
        Returns: List of (id1, id2) pairs of duplicate quote IDs
        """
        origin, destination = route.split("-")
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
        
        query = (
            select(FareQuote)
            .where(FareQuote.origin == origin)
            .where(FareQuote.destination == destination)
            .where(FareQuote.scrape_timestamp >= cutoff)
            .order_by(FareQuote.scrape_timestamp)
        )
        
        quotes = session.execute(query).scalars().all()
        
        duplicates = []
        for i in range(len(quotes)):
            for j in range(i + 1, len(quotes)):
                if (
                    quotes[i].carrier == quotes[j].carrier
                    and quotes[i].total_fare == quotes[j].total_fare
                    and quotes[i].advance_purchase_days == quotes[j].advance_purchase_days
                    and abs((quotes[i].scrape_timestamp - quotes[j].scrape_timestamp).total_seconds()) < (time_window_minutes * 60)
                ):
                    duplicates.append((quotes[i].id, quotes[j].id))
        
        return duplicates
    
    @staticmethod
    def remove_duplicate_quotes(session: Session, duplicate_ids: list[int]) -> int:
        """Remove duplicate quotes, keeping the first one."""
        count = 0
        for quote_id in duplicate_ids[1:]:  # Keep first, remove rest
            quote = session.query(FareQuote).filter_by(id=quote_id).first()
            if quote:
                session.delete(quote)
                count += 1
        
        session.commit()
        return count


class DataQualityScorer:
    """Scores data quality of collected fares."""
    
    @staticmethod
    def score_quote_quality(quote: FareQuote) -> float:
        """
        Score quality of a single quote (0-100).
        
        Factors:
        - Valid fare range
        - Tax/fee present and reasonable
        - Complete metadata
        - Recent timestamp
        """
        score = 50.0  # Base score
        
        # Fare range check (+20)
        if DataValidator.is_valid_fare_range(quote.total_fare):
            score += 20
        
        # Tax/fee present and valid (+20)
        if quote.base_fare and quote.taxes_fees:
            if DataValidator.validate_tax_fees(quote.total_fare, quote.base_fare, quote.taxes_fees):
                score += 20
        
        # Metadata completeness (+10)
        if all([quote.carrier, quote.source_site, quote.fare_class]):
            score += 10
        
        # Recent data (+10, within last hour)
        time_diff = (datetime.now(timezone.utc) - quote.scrape_timestamp).total_seconds()
        if time_diff < 3600:  # Within 1 hour
            score += 10
        
        return min(100.0, score)
    
    @staticmethod
    def calculate_route_quality(session: Session, origin: str, destination: str) -> float:
        """Calculate average data quality for a route."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        query = (
            select(FareQuote)
            .where(FareQuote.origin == origin)
            .where(FareQuote.destination == destination)
            .where(FareQuote.scrape_timestamp >= cutoff)
        )
        
        quotes = session.execute(query).scalars().all()
        
        if not quotes:
            return 0.0
        
        scores = [DataQualityScorer.score_quote_quality(q) for q in quotes]
        return statistics.mean(scores)
    
    @staticmethod
    def get_system_quality_report(session: Session) -> dict[str, Any]:
        """Get overall data quality report for the system."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=1)
        
        # Count valid and invalid quotes
        all_quotes_query = select(FareQuote).where(FareQuote.scrape_timestamp >= cutoff)
        all_quotes = session.execute(all_quotes_query).scalars().all()
        
        valid_count = sum(1 for q in all_quotes if DataValidator.validate_quote(q)[0])
        invalid_count = len(all_quotes) - valid_count
        
        # Average quality score
        quality_scores = [DataQualityScorer.score_quote_quality(q) for q in all_quotes]
        avg_quality = statistics.mean(quality_scores) if quality_scores else 0.0
        
        # Coverage by source
        source_query = select(FareQuote.source_site, func.count()).where(
            FareQuote.scrape_timestamp >= cutoff
        ).group_by(FareQuote.source_site)
        
        sources = session.execute(source_query).all()
        source_coverage = {source: count for source, count in sources}
        
        return {
            "total_quotes": len(all_quotes),
            "valid_quotes": valid_count,
            "invalid_quotes": invalid_count,
            "validity_percent": (valid_count / len(all_quotes) * 100) if all_quotes else 0,
            "average_quality_score": round(avg_quality, 2),
            "source_coverage": source_coverage,
            "report_timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Import after definitions to avoid circular imports
from sqlalchemy import func
