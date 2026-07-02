"""
FocusOS — Database Initializer
================================
Creates all tables in local PostgreSQL. Run once before first start.

Usage:
    python -m database.init_db           # create tables
    python -m database.init_db --seed    # create tables + seed demo data
"""

import asyncio
import logging
import sys
import uuid
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Create all tables (idempotent)."""
    from database.db import engine, Base
    # Import all models so their metadata is registered
    import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("[DB] All tables created (or already exist).")


async def seed_db() -> None:
    """Seed demo tasks if the table is empty."""
    from database.db import AsyncSessionLocal
    from models.task import Task
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        count_result = await db.execute(select(func.count()).select_from(Task))
        count = count_result.scalar()
        if count and count > 0:
            logger.info("[SEED] Database already seeded — skipping.")
            return

        now = datetime.now(timezone.utc)
        tasks = [
            Task(id=str(uuid.uuid4()), title="Prepare Investor Pitch Deck",
                 description="10-slide deck covering product vision, traction, and ask.",
                 deadline=now + timedelta(hours=36), estimated_hours=8.0, category="work", status="in_progress", source="manual"),
            Task(id=str(uuid.uuid4()), title="Submit Hackathon Project",
                 description="Final submission — code + demo video + README.",
                 deadline=now + timedelta(hours=12), estimated_hours=4.0, category="work", status="pending", source="manual"),
            Task(id=str(uuid.uuid4()), title="Complete Q2 Performance Review",
                 description="Self-assessment form for the engineering team.",
                 deadline=now + timedelta(days=2), estimated_hours=2.0, category="work", status="pending", source="manual"),
            Task(id=str(uuid.uuid4()), title="Read System Design Interview Book",
                 description="Finish chapters 5–8 before the interview next week.",
                 deadline=now + timedelta(days=5), estimated_hours=6.0, category="study", status="pending", source="manual"),
            Task(id=str(uuid.uuid4()), title="Write Blog Post: AI Productivity in 2026",
                 description="1500-word article for the engineering blog.",
                 deadline=now + timedelta(days=3), estimated_hours=3.0, category="work", status="pending", source="manual"),
        ]
        db.add_all(tasks)
        await db.commit()
        logger.info("[SEED] Seeded %d demo tasks.", len(tasks))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(init_db())
    if "--seed" in sys.argv:
        asyncio.run(seed_db())
        print("✅  Database initialised and seeded.")
    else:
        print("✅  Database initialised. Run with --seed to add demo data.")
