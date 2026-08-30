from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class FareQuote(Base):
    __tablename__ = "fare_quotes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    origin: Mapped[str] = mapped_column(String(10), nullable=False)
    destination: Mapped[str] = mapped_column(String(10), nullable=False)
    carrier: Mapped[str] = mapped_column(String(50), nullable=False)
    source_site: Mapped[str] = mapped_column(String(50), nullable=False)
    scrape_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    departure_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    advance_purchase_days: Mapped[int] = mapped_column(Integer, nullable=False)
    fare_class: Mapped[str | None] = mapped_column(String(30), nullable=True)
    base_fare: Mapped[float | None] = mapped_column(Float, nullable=True)
    taxes_fees: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_fare: Mapped[float] = mapped_column(Float, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
