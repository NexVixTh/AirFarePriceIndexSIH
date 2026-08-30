from __future__ import annotations

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .base import Base


class DatabaseSessionManager:
    def __init__(self, database_url: str):
        self._engine: Engine = create_engine(database_url, future=True)
        self._session_factory = sessionmaker(bind=self._engine, autoflush=False, autocommit=False, expire_on_commit=False)

    def create_all(self) -> None:
        Base.metadata.create_all(bind=self._engine)

    def session(self) -> Generator[Session, None, None]:
        session = self._session_factory()
        try:
            yield session
        finally:
            session.close()


def create_database_session(database_url: str) -> Session:
    engine = create_engine(database_url, future=True)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def get_database_url() -> str:
    import os

    return os.getenv("DATABASE_URL", "postgresql+psycopg2://apix_user:apix_password@localhost:5432/apix")
