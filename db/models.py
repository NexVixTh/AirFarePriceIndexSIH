from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class FareQuote(Base):
    __tablename__ = "fare_quotes"
    __table_args__ = (
        Index("idx_fare_quotes_route_date", "origin", "destination", "departure_date"),
        Index("idx_fare_quotes_route_carrier_date", "origin", "destination", "carrier", "departure_date"),
        Index("idx_fare_quotes_advance_days", "advance_purchase_days"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    origin: Mapped[str] = mapped_column(String(10), nullable=False)
    destination: Mapped[str] = mapped_column(String(10), nullable=False)
    carrier: Mapped[str] = mapped_column(String(50), nullable=False)
    source_site: Mapped[str] = mapped_column(String(50), nullable=False)
    scrape_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    departure_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    advance_purchase_days: Mapped[int] = mapped_column(Integer, nullable=False)
    fare_class: Mapped[str | None] = mapped_column(String(30), nullable=True)
    base_fare: Mapped[float | None] = mapped_column(Float, nullable=True)
    taxes_fees: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_fare: Mapped[float] = mapped_column(Float, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class CPIReference(Base):
    __tablename__ = "cpi_reference"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    period: Mapped[str] = mapped_column(String(30), nullable=False)
    sub_group: Mapped[str] = mapped_column(String(80), nullable=False, default="Transport and Communication")
    index_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    inflation_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    source: Mapped[str] = mapped_column(String(80), nullable=False, default="MoSPI CPI API")


class IndexHistory(Base):
    __tablename__ = "index_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    base_period: Mapped[str] = mapped_column(String(30), nullable=False, default="2024-01")
    current_period: Mapped[str] = mapped_column(String(30), nullable=False)
    national_index: Mapped[float] = mapped_column(Float, nullable=False)
    coverage_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    routes_covered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_routes_in_basket: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    route_indices_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    airline_indices_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    methodology: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Weighted Jevons / Laspeyres"
    )


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    route: Mapped[str] = mapped_column(String(20), nullable=False)
    carrier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fare: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_fare: Mapped[float] = mapped_column(Float, nullable=False)
    spike_percent: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIUM")
    anomaly_type: Mapped[str] = mapped_column(String(50), nullable=False, default="PRICE_SURGE")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)


class ScraperJobLog(Base):
    __tablename__ = "scraper_job_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scraper_name: Mapped[str] = mapped_column(String(80), nullable=False)
    route: Mapped[str] = mapped_column(String(20), nullable=False)
    advance_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    quotes_collected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
