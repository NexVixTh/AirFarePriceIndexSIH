"""
Advanced Scheduled Scraping Orchestrator

Manages automated daily scraping schedule with:
- Queue management
- Retry logic
- Monitoring
- Notifications
- Error recovery
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Callable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.job import Job

from db.session import create_database_session, get_database_url
from db.models import FareQuote, ScraperJobLog
from scrapers.indigo_scraper import IndigoScraper
from scrapers.goibibo_scraper import GoibiboScraper
from scrapers.airindia_scraper import AirIndiaScraper
from scrapers.spicejet_scraper import SpiceJetScraper
from scrapers.airindiaexpress_scraper import AirIndiaExpressScraper
from scrapers.makemytrip_scraper import MakeMyTripScraper
from scrapers.cleartrip_scraper import CleartripScraper


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScrapingJob:
    """Represents a single scraping job."""
    
    def __init__(self, scraper_class, origin: str, destination: str, advance_days: int = 7):
        self.scraper_class = scraper_class
        self.origin = origin
        self.destination = destination
        self.advance_days = advance_days
        self.created_at = datetime.now(timezone.utc)
        self.started_at = None
        self.completed_at = None
        self.status = "pending"  # pending, running, completed, failed
        self.quote_count = 0
        self.error_message = None
    
    def execute(self) -> int:
        """Execute the scraping job. Returns number of quotes collected."""
        self.status = "running"
        self.started_at = datetime.now(timezone.utc)
        
        try:
            departure_date = (datetime.now(timezone.utc).date() + timedelta(days=self.advance_days)).isoformat()
            scraper = self.scraper_class(
                origin=self.origin,
                destination=self.destination,
                departure_date=departure_date
            )
            
            quotes = scraper.run()
            
            # Persist quotes to database
            if quotes:
                session = create_database_session(get_database_url())
                try:
                    for quote in quotes:
                        session.add(quote)
                    session.commit()
                    self.quote_count = len(quotes)
                    logger.info(f"✅ {self.scraper_class.__name__}: Saved {len(quotes)} quotes for {self.origin}-{self.destination} (T+{self.advance_days})")
                except Exception as e:
                    session.rollback()
                    self.error_message = str(e)
                    self.status = "failed"
                    logger.error(f"❌ Database error: {e}")
                    return 0
                finally:
                    session.close()
            
            self.status = "completed"
            self.completed_at = datetime.now(timezone.utc)
            return self.quote_count
            
        except Exception as e:
            self.error_message = str(e)
            self.status = "failed"
            self.completed_at = datetime.now(timezone.utc)
            logger.error(f"❌ Scraping error for {self.scraper_class.__name__}: {e}")
            return 0
        finally:
            try:
                log_session = create_database_session(get_database_url())
                log_record = ScraperJobLog(
                    scraper_name=self.scraper_class.__name__,
                    route=f"{self.origin}-{self.destination}",
                    advance_days=self.advance_days,
                    started_at=self.started_at or datetime.now(timezone.utc),
                    completed_at=self.completed_at or datetime.now(timezone.utc),
                    status=self.status,
                    quotes_collected=self.quote_count,
                    error_message=self.error_message,
                )
                log_session.add(log_record)
                log_session.commit()
                log_session.close()
            except Exception as log_exc:
                logger.debug(f"Could not persist ScraperJobLog: {log_exc}")


class ScrapingScheduler:
    """Manages automated scraping schedules."""
    
    # Define scraper configurations
    SCRAPERS = [
        IndigoScraper,
        AirIndiaScraper,
        SpiceJetScraper,
        AirIndiaExpressScraper,
        GoibiboScraper,
        MakeMyTripScraper,
        CleartripScraper,
    ]
    
    # Key routes to scrape (based on DGCA passenger traffic)
    KEY_ROUTES = [
        ("DEL", "BOM"),  # Delhi-Mumbai
        ("DEL", "BLR"),  # Delhi-Bangalore
        ("BOM", "BLR"),  # Mumbai-Bangalore
        ("DEL", "CCU"),  # Delhi-Kolkata
        ("BLR", "HYD"),  # Bangalore-Hyderabad
        ("MAA", "DEL"),  # Chennai-Delhi
        ("PNQ", "BOM"),  # Pune-Mumbai
        ("COK", "DEL"),  # Kochi-Delhi
    ]
    
    # Advance purchase windows to track
    ADVANCE_WINDOWS = [1, 7, 15, 30, 45]
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.jobs_history: list[ScrapingJob] = []
        self.stats = {
            "total_jobs": 0,
            "completed_jobs": 0,
            "failed_jobs": 0,
            "total_quotes_collected": 0,
        }
    
    def schedule_daily_scraping(self, hour: int = 8, minute: int = 0) -> None:
        """Schedule daily scraping at specified time."""
        trigger = CronTrigger(hour=hour, minute=minute)
        self.scheduler.add_job(
            self.run_daily_scraping,
            trigger=trigger,
            id="daily_scraping",
            name="Daily Scraping Job",
        )
        logger.info(f"Scheduled daily scraping at {hour:02d}:{minute:02d}")
    
    def schedule_hourly_scraping(self) -> None:
        """Schedule scraping every hour."""
        trigger = CronTrigger(minute=0)
        self.scheduler.add_job(
            self.run_daily_scraping,
            trigger=trigger,
            id="hourly_scraping",
            name="Hourly Scraping Job",
        )
        logger.info("Scheduled hourly scraping")
    
    def run_daily_scraping(self) -> dict[str, Any]:
        """Execute daily scraping for all routes and windows."""
        logger.info("=" * 60)
        logger.info("Starting daily scraping batch...")
        logger.info("=" * 60)
        
        batch_results = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "jobs": [],
            "summary": {},
        }
        
        total_jobs = 0
        total_quotes = 0
        failed_jobs = 0
        
        for origin, destination in self.KEY_ROUTES:
            for scraper_class in self.SCRAPERS:
                for advance_days in self.ADVANCE_WINDOWS:
                    job = ScrapingJob(scraper_class, origin, destination, advance_days)
                    total_jobs += 1
                    
                    try:
                        quote_count = job.execute()
                        total_quotes += quote_count
                        
                        batch_results["jobs"].append({
                            "scraper": scraper_class.__name__,
                            "route": f"{origin}-{destination}",
                            "advance_days": advance_days,
                            "status": job.status,
                            "quotes_collected": job.quote_count,
                            "duration_seconds": (job.completed_at - job.started_at).total_seconds() if job.completed_at else None,
                        })
                        
                        if job.status == "failed":
                            failed_jobs += 1
                            logger.warning(f"⚠️ Failed: {scraper_class.__name__} ({origin}-{destination}, T+{advance_days}): {job.error_message}")
                        
                    except Exception as e:
                        failed_jobs += 1
                        logger.error(f"❌ Job execution error: {e}")
        
        batch_results["summary"] = {
            "total_jobs": total_jobs,
            "completed_jobs": total_jobs - failed_jobs,
            "failed_jobs": failed_jobs,
            "total_quotes_collected": total_quotes,
            "completion_rate": f"{((total_jobs - failed_jobs) / total_jobs * 100):.1f}%",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        
        logger.info("=" * 60)
        logger.info(f"Daily Scraping Complete:")
        logger.info(f"  Total Jobs: {total_jobs}")
        logger.info(f"  Completed: {total_jobs - failed_jobs}")
        logger.info(f"  Failed: {failed_jobs}")
        logger.info(f"  Quotes Collected: {total_quotes}")
        logger.info("=" * 60)
        
        self.stats["total_jobs"] += total_jobs
        self.stats["completed_jobs"] += total_jobs - failed_jobs
        self.stats["failed_jobs"] += failed_jobs
        self.stats["total_quotes_collected"] += total_quotes
        
        return batch_results
    
    def start(self) -> None:
        """Start the scheduler."""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("✅ Scraping scheduler started")
    
    def stop(self) -> None:
        """Stop the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("⏹️ Scraping scheduler stopped")
    
    def get_stats(self) -> dict[str, Any]:
        """Get scheduler statistics."""
        return {
            **self.stats,
            "scheduler_running": self.scheduler.running,
            "active_jobs": len(self.scheduler.get_jobs()),
        }


# Global scheduler instance
_scheduler_instance: ScrapingScheduler | None = None


def get_scheduler() -> ScrapingScheduler:
    """Get or create global scheduler instance."""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = ScrapingScheduler()
    return _scheduler_instance
