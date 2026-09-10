"""
Multi-Window Fare Tracking

Tracks fares for different advance-purchase windows:
- T+1: Next day
- T+7: 7 days ahead
- T+15: 15 days ahead
- T+30: 30 days ahead
- T+45: 45 days ahead

This captures price elasticity with respect to booking lead time.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from db.models import FareQuote


class MultiWindowTracker:
    """Tracks fares across multiple advance-purchase windows."""
    
    ADVANCE_DAYS = [1, 7, 15, 30, 45]  # Advance purchase windows
    
    @staticmethod
    def get_window_name(days: int) -> str:
        """Convert days to window name."""
        return f"T+{days}"
    
    @staticmethod
    def track_route_across_windows(
        session: Session,
        origin: str,
        destination: str,
        base_date: date | None = None,
    ) -> dict[str, Any]:
        """
        Track a route's prices across all advance-purchase windows.
        
        Returns data structure:
        {
            "route": "DEL-BOM",
            "date": "2024-09-10",
            "windows": {
                "T+1": {...},
                "T+7": {...},
                ...
            },
            "elasticity": {...}
        }
        """
        if base_date is None:
            base_date = datetime.now(timezone.utc).date()
        
        windows_data = {}
        
        for advance_days in MultiWindowTracker.ADVANCE_DAYS:
            window_name = MultiWindowTracker.get_window_name(advance_days)
            departure_date = base_date + timedelta(days=advance_days)
            
            # Query quotes for this specific window
            query = (
                select(FareQuote)
                .where(FareQuote.origin == origin)
                .where(FareQuote.destination == destination)
                .where(FareQuote.departure_date == departure_date)
                .where(FareQuote.is_available == True)
            )
            
            quotes = session.execute(query).scalars().all()
            
            if quotes:
                fares = [q.total_fare for q in quotes]
                min_fare = min(fares)
                max_fare = max(fares)
                avg_fare = sum(fares) / len(fares)
                
                windows_data[window_name] = {
                    "advance_days": advance_days,
                    "departure_date": departure_date.isoformat(),
                    "min_fare": min_fare,
                    "max_fare": max_fare,
                    "avg_fare": avg_fare,
                    "quote_count": len(quotes),
                    "airlines": list(set(q.carrier for q in quotes)),
                }
            else:
                windows_data[window_name] = {
                    "advance_days": advance_days,
                    "departure_date": departure_date.isoformat(),
                    "data_available": False,
                }
        
        # Calculate elasticity
        elasticity = MultiWindowTracker._calculate_elasticity(windows_data)
        
        return {
            "route": f"{origin}-{destination}",
            "base_date": base_date.isoformat(),
            "windows": windows_data,
            "elasticity": elasticity,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    @staticmethod
    def _calculate_elasticity(windows_data: dict[str, Any]) -> dict[str, float]:
        """
        Calculate price elasticity with respect to advance purchase days.
        
        Elasticity = % change in price / % change in days
        """
        valid_windows = [
            (k, v) for k, v in windows_data.items()
            if "avg_fare" in v
        ]
        
        if len(valid_windows) < 2:
            return {}
        
        elasticity = {}
        for i in range(len(valid_windows) - 1):
            window1_name, data1 = valid_windows[i]
            window2_name, data2 = valid_windows[i + 1]
            
            fare1 = data1["avg_fare"]
            fare2 = data2["avg_fare"]
            days1 = data1["advance_days"]
            days2 = data2["advance_days"]
            
            if fare1 > 0 and days1 > 0:
                fare_change_pct = ((fare2 - fare1) / fare1) * 100
                days_change_pct = ((days2 - days1) / days1) * 100
                
                if days_change_pct != 0:
                    elasticity_value = fare_change_pct / days_change_pct
                    elasticity[f"{window1_name}_to_{window2_name}"] = round(elasticity_value, 3)
        
        return elasticity
    
    @staticmethod
    def get_lead_time_elasticity_curve(
        session: Session,
        origin: str,
        destination: str,
    ) -> dict[str, Any]:
        """
        Generate elasticity curve data for visualization.
        
        Shows how prices change as advance purchase time decreases.
        """
        curve_data = []
        
        for advance_days in MultiWindowTracker.ADVANCE_DAYS:
            departure_date = datetime.now(timezone.utc).date() + timedelta(days=advance_days)
            
            query = (
                select(FareQuote.total_fare)
                .where(FareQuote.origin == origin)
                .where(FareQuote.destination == destination)
                .where(FareQuote.departure_date == departure_date)
                .where(FareQuote.is_available == True)
            )
            
            fares = [row[0] for row in session.execute(query).all()]
            
            if fares:
                avg_fare = sum(fares) / len(fares)
                curve_data.append({
                    "advance_days": advance_days,
                    "window": f"T+{advance_days}",
                    "avg_price": round(avg_fare, 2),
                    "quote_count": len(fares),
                })
        
        return {
            "route": f"{origin}-{destination}",
            "elasticity_curve": curve_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
