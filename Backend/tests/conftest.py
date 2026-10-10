"""Test fixtures: isolated in-memory SQLite, demo-only AI chain, FastAPI TestClient.

Environment is pinned BEFORE any app import so tests never touch real API keys,
the real database, or the lifespan auto-seed regardless of a developer's .env.
"""
from __future__ import annotations

import os
import tempfile

_TMP_DIR = tempfile.mkdtemp(prefix="karobaar_test_")
os.environ["AI_PROVIDER"] = "demo"
os.environ["AUTO_SEED"] = "false"
os.environ["GROQ_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/lifespan.db".replace("\\", "/")
os.environ["UPLOADS_DIR_PATH"] = _TMP_DIR

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.auth import DEMO_MERCHANT, get_merchant_id  # noqa: E402
from app.data.seed import load_seed  # noqa: E402
from app.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

# One shared in-memory connection (StaticPool) so the fixture session and the
# endpoint dependency see the exact same data across threads.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def seeded_db(db):
    load_seed(db, merchant_id=DEMO_MERCHANT)
    return db


@pytest.fixture()
def client(db):
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_merchant_id] = lambda: DEMO_MERCHANT
    try:
        # No context manager -> lifespan (real engine init/auto-seed) never runs.
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def seeded_client(seeded_db, client):
    return client
