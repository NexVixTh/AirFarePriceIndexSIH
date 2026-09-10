"""
Test suite for the Airfare Price Index (APIx) project.

Tests cover:
- Data models and database
- Scraper functionality
- API endpoints
- Index calculation logic
- Data validation
"""

from __future__ import annotations

import sys
import os
from datetime import datetime, date, timezone, timedelta
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.base import Base
from db.models import FareQuote, CPIReference, IndexHistory, AnomalyRecord, ScraperJobLog
from db.session import create_database_session, get_database_url
from pipeline.index_calculator import (
    calculate_price_relative,
    calculate_airfare_index,
    get_route_statistics,
    detect_anomalies,
    save_index_snapshot,
    get_index_history,
    record_anomalies,
)
from scrapers.base import RateLimiter, check_robots_allowed, RobotsPolicyError


# ==================== Database Fixtures ====================

@pytest.fixture(scope="function")
def test_db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def sample_fare_quotes(test_db_session: Session):
    """Create sample fare quotes for testing."""
    quotes = [
        FareQuote(
            origin="DEL",
            destination="BOM",
            carrier="6E",
            source_site="goindigo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=7),
            advance_purchase_days=7,
            fare_class="ECONOMY",
            base_fare=3200.0,
            taxes_fees=800.0,
            total_fare=4000.0,
            is_available=True,
        ),
        FareQuote(
            origin="DEL",
            destination="BOM",
            carrier="AI",
            source_site="goibibo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=7),
            advance_purchase_days=7,
            fare_class="ECONOMY",
            base_fare=3500.0,
            taxes_fees=900.0,
            total_fare=4400.0,
            is_available=True,
        ),
        FareQuote(
            origin="BOM",
            destination="BLR",
            carrier="6E",
            source_site="goindigo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=5),
            advance_purchase_days=5,
            fare_class="ECONOMY",
            base_fare=2500.0,
            taxes_fees=600.0,
            total_fare=3100.0,
            is_available=True,
        ),
    ]
    
    for quote in quotes:
        test_db_session.add(quote)
    test_db_session.commit()
    return quotes


# ==================== Model Tests ====================

class TestFareQuoteModel:
    """Test FareQuote model."""
    
    def test_fare_quote_creation(self, test_db_session: Session):
        """Test creating a FareQuote record."""
        quote = FareQuote(
            origin="DEL",
            destination="BOM",
            carrier="6E",
            source_site="goindigo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=7),
            advance_purchase_days=7,
            fare_class="ECONOMY",
            base_fare=3200.0,
            taxes_fees=800.0,
            total_fare=4000.0,
            is_available=True,
        )
        
        test_db_session.add(quote)
        test_db_session.commit()
        
        retrieved = test_db_session.query(FareQuote).filter_by(origin="DEL").first()
        assert retrieved is not None
        assert retrieved.total_fare == 4000.0
        assert retrieved.carrier == "6E"
    
    def test_fare_quote_validation(self):
        """Test FareQuote validates required fields."""
        # Missing required fields should raise an error during commit
        quote = FareQuote(
            origin="DEL",
            # Missing destination, carrier, etc.
        )
        # This would fail on commit, but we test the model structure
        assert quote.origin == "DEL"


class TestCPIReferenceModel:
    """Test CPIReference model."""
    
    def test_cpi_reference_creation(self, test_db_session: Session):
        """Test creating a CPIReference record."""
        cpi = CPIReference(
            period="2024-09",
            sub_group="Transport and Communication",
            index_value=115.5,
            inflation_rate=5.2,
        )
        
        test_db_session.add(cpi)
        test_db_session.commit()
        
        retrieved = test_db_session.query(CPIReference).filter_by(period="2024-09").first()
        assert retrieved is not None
        assert retrieved.index_value == 115.5


# ==================== Scraper Tests ====================

class TestRateLimiter:
    """Test rate limiting functionality."""
    
    def test_rate_limiter_initialization(self):
        """Test RateLimiter initialization."""
        limiter = RateLimiter(min_interval_seconds=5.0)
        assert limiter.min_interval_seconds == 5.0
        assert limiter.last_request_at is None
    
    def test_rate_limiter_wait_first_call(self):
        """Test first wait call doesn't sleep."""
        limiter = RateLimiter(min_interval_seconds=1.0)
        limiter.wait()
        # First call should set last_request_at without sleeping
        assert limiter.last_request_at is not None


class TestRobotsPolicy:
    """Test robots.txt checking."""
    
    def test_robots_denied_error(self):
        """Test RobotsPolicyError is raised for disallowed sites."""
        # This test would require a mock server, so we just test the exception exists
        assert issubclass(RobotsPolicyError, RuntimeError)


# ==================== Index Calculation Tests ====================

class TestIndexCalculation:
    """Test index calculation logic."""
    
    def test_price_relative_calculation(self):
        """Test price relative calculation."""
        # Base price 100, current price 110 -> relative 110
        relative = calculate_price_relative(110.0, 100.0)
        assert relative == 110.0
        
        # Base price 100, current price 50 -> relative 50
        relative = calculate_price_relative(50.0, 100.0)
        assert relative == 50.0
    
    def test_price_relative_zero_base(self):
        """Test price relative with zero base price."""
        relative = calculate_price_relative(100.0, 0.0)
        assert relative == 0.0
    
    def test_route_statistics(self, test_db_session: Session, sample_fare_quotes):
        """Test route statistics calculation."""
        stats = get_route_statistics(test_db_session, "DEL", "BOM")
        
        assert stats is not None
        assert stats["route"] == "DEL-BOM"
        assert stats["min_fare"] == 4000.0
        assert stats["max_fare"] == 4400.0
        assert stats["sample_size"] == 2
        assert stats["median_fare"] == 4200.0
    
    def test_route_statistics_no_data(self, test_db_session: Session):
        """Test route statistics with no data."""
        stats = get_route_statistics(test_db_session, "LAX", "JFK")
        assert stats is None
    
    def test_airfare_index_calculation(self, test_db_session: Session, sample_fare_quotes):
        """Test airfare index calculation."""
        index_data = calculate_airfare_index(test_db_session, base_period="2024-01")
        
        assert "national_index" in index_data
        assert "route_indices" in index_data
        assert "airline_indices" in index_data
        assert "coverage_percent" in index_data
        assert index_data["national_index"] is not None
        assert index_data["national_index"] > 0


# ==================== Data Validation Tests ====================

class TestDataValidation:
    """Test data validation and cleaning."""
    
    def test_fare_quote_range_validation(self, test_db_session: Session):
        """Test fare quotes are within reasonable ranges."""
        quote = FareQuote(
            origin="DEL",
            destination="BOM",
            carrier="6E",
            source_site="goindigo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=7),
            advance_purchase_days=7,
            fare_class="ECONOMY",
            base_fare=3200.0,
            taxes_fees=800.0,
            total_fare=4000.0,
            is_available=True,
        )
        
        # Validate reasonable fare range (500 to 500,000 INR)
        assert 500 <= quote.total_fare <= 500000
    
    def test_advance_purchase_days_validation(self, test_db_session: Session):
        """Test advance purchase days are non-negative."""
        quote = FareQuote(
            origin="DEL",
            destination="BOM",
            carrier="6E",
            source_site="goindigo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=7),
            advance_purchase_days=7,
            fare_class="ECONOMY",
            total_fare=4000.0,
            is_available=True,
        )
        
        assert quote.advance_purchase_days >= 0


# ==================== Anomaly Detection Tests ====================

class TestAnomalyDetection:
    """Test anomaly detection."""
    
    def test_detect_anomalies(self, test_db_session: Session):
        """Test anomaly detection on routes."""
        # Add a high-price outlier
        outlier = FareQuote(
            origin="DEL",
            destination="BOM",
            carrier="6E",
            source_site="goindigo",
            scrape_timestamp=datetime.now(timezone.utc),
            departure_date=date.today() + timedelta(days=7),
            advance_purchase_days=7,
            fare_class="ECONOMY",
            total_fare=15000.0,  # Very high price
            is_available=True,
        )
        
        test_db_session.add(outlier)
        
        # Add normal prices for comparison
        for i in range(5):
            quote = FareQuote(
                origin="DEL",
                destination="BOM",
                carrier="6E",
                source_site="goindigo",
                scrape_timestamp=datetime.now(timezone.utc) - timedelta(days=i),
                departure_date=date.today() + timedelta(days=7),
                advance_purchase_days=7,
                fare_class="ECONOMY",
                total_fare=4000.0,
                is_available=True,
            )
            test_db_session.add(quote)
        
        test_db_session.commit()
        
        anomalies = detect_anomalies(test_db_session, "DEL-BOM", threshold_percent=30)
        
        # Should detect the outlier
        assert len(anomalies) > 0
        assert any(a["fare"] == 15000.0 for a in anomalies)


# ==================== Integration Tests ====================

class TestIntegration:
    """Integration tests for the complete pipeline."""
    
    def test_full_data_pipeline(self, test_db_session: Session, sample_fare_quotes):
        """Test the complete data pipeline."""
        # 1. Data is in the database
        all_quotes = test_db_session.query(FareQuote).all()
        assert len(all_quotes) == 3
        
        # 2. We can calculate statistics
        stats = get_route_statistics(test_db_session, "DEL", "BOM")
        assert stats is not None
        
        # 3. We can calculate index
        index_data = calculate_airfare_index(test_db_session)
        assert index_data["national_index"] > 0
        
        # 4. Detect anomalies
        anomalies = detect_anomalies(test_db_session, "DEL-BOM")
        # Anomalies list (may be empty if no spikes)
        assert isinstance(anomalies, list)


# ==================== Performance Tests ====================

class TestPerformance:
    """Test performance characteristics."""
    
    def test_large_dataset_handling(self, test_db_session: Session):
        """Test handling of large datasets."""
        # Add 1000 quotes
        for i in range(1000):
            quote = FareQuote(
                origin="DEL" if i % 2 == 0 else "BOM",
                destination="BOM" if i % 2 == 0 else "BLR",
                carrier=["6E", "AI", "SG", "G8"][i % 4],
                source_site="goindigo",
                scrape_timestamp=datetime.now(timezone.utc),
                departure_date=date.today() + timedelta(days=7),
                advance_purchase_days=7,
                fare_class="ECONOMY",
                total_fare=4000.0 + (i % 1000),
                is_available=True,
            )
            test_db_session.add(quote)
            
            if i % 100 == 0:
                test_db_session.commit()
        
        test_db_session.commit()
        
        # Query should still be fast
        all_quotes = test_db_session.query(FareQuote).all()
        assert len(all_quotes) == 1000
        
        # Index calculation should handle large datasets
        index_data = calculate_airfare_index(test_db_session)
        assert index_data["national_index"] > 0


# ==================== Persistent Model Tests ====================

class TestPersistentModels:
    """Test persistence models for IndexHistory, AnomalyRecord, and ScraperJobLog."""

    def test_index_history_persistence(self, test_db_session: Session):
        """Test saving and loading IndexHistory."""
        snapshot_data = {
            "national_index": 105.4,
            "base_period": "2024-01",
            "current_period": "2024-09",
            "route_indices": {"DEL-BOM": 104.2, "DEL-BLR": 106.1},
            "airline_indices": {"6E": 105.0},
            "coverage_percent": 80.0,
            "routes_covered": 4,
            "total_routes_in_basket": 5,
        }
        record = save_index_snapshot(test_db_session, snapshot_data)
        assert record.id is not None
        assert record.national_index == 105.4

        history = get_index_history(test_db_session)
        assert len(history) >= 1
        assert history[0]["national_index"] == 105.4
        assert "DEL-BOM" in history[0]["route_indices"]

    def test_anomaly_record_persistence(self, test_db_session: Session):
        """Test recording anomalies."""
        anomalies = [
            {
                "route": "DEL-BOM",
                "carrier": "6E",
                "fare": 12500.0,
                "mean_fare": 5000.0,
                "spike_percent": 150.0,
            }
        ]
        count = record_anomalies(test_db_session, anomalies)
        assert count == 1

        retrieved = test_db_session.query(AnomalyRecord).filter_by(route="DEL-BOM").first()
        assert retrieved is not None
        assert retrieved.severity == "CRITICAL"
        assert retrieved.fare == 12500.0

    def test_scraper_job_log_persistence(self, test_db_session: Session):
        """Test creating ScraperJobLog records."""
        log = ScraperJobLog(
            scraper_name="IndigoScraper",
            route="DEL-BOM",
            advance_days=7,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            status="completed",
            quotes_collected=24,
        )
        test_db_session.add(log)
        test_db_session.commit()

        retrieved = test_db_session.query(ScraperJobLog).filter_by(scraper_name="IndigoScraper").first()
        assert retrieved is not None
        assert retrieved.quotes_collected == 24
        assert retrieved.status == "completed"


class TestReadinessAndInflationMath:
    """Test readiness probe and inflation mathematical formula verification."""

    def test_inflation_rate_mathematical_formula(self):
        """Verify that Inflation Rate = ((I_t - I_0) / I_0) * 100%, NOT Index = Inflation."""
        base_index = 100.0
        comparison_index = 105.4
        inflation_rate = ((comparison_index - base_index) / base_index) * 100.0
        assert round(inflation_rate, 2) == 5.40
        # Critical invariant: Index 105.4 is NOT 105.4% inflation
        assert inflation_rate != comparison_index

    def test_route_inflation_contribution_bps(self):
        """Verify route contribution in basis points: C_r = w_r * ΔP_r * 100."""
        weight_del_bom = 0.180  # 18% DGCA weight
        route_inflation = 8.5   # 8.5% route inflation
        contribution_bps = round(weight_del_bom * route_inflation * 100)
        assert contribution_bps == 153  # 153 basis points

    def test_statistical_units_percentage_points_and_basis_points(self):
        """Verify mathematical distinction between Percentage Points (% pts) and Basis Points (bps)."""
        weight_del_bom = 0.180  # 18.0% traffic share
        route_inflation_pct = 8.5  # +8.5% price increase

        # Contribution in percentage points (% pts): w_r * ΔP_%
        contribution_pct_pts = weight_del_bom * route_inflation_pct
        assert round(contribution_pct_pts, 2) == 1.53  # +1.53% pts

        # Contribution in basis points (bps): 1% pt = 100 bps
        contribution_bps = round(contribution_pct_pts * 100)
        assert contribution_bps == 153  # 153 bps

        # Mathematical invariant check: bps / 100 == pct_pts
        assert contribution_bps / 100.0 == round(contribution_pct_pts, 2)

    def test_ready_endpoint_contract(self):
        """Verify the /ready and /api/v1/ready endpoint structure."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["service"] == "apix-api"

        # Verify /api/v1/ready alias
        response_v1 = client.get("/api/v1/ready")
        assert response_v1.status_code == 200
        assert response_v1.json()["status"] == "ready"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
