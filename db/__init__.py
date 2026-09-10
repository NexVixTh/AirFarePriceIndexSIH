from .base import Base
from .models import AnomalyRecord, CPIReference, FareQuote, IndexHistory, ScraperJobLog

__all__ = [
    "Base",
    "FareQuote",
    "CPIReference",
    "IndexHistory",
    "AnomalyRecord",
    "ScraperJobLog",
]
