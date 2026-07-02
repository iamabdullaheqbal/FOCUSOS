"""FocusOS — Momentum Agent"""

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class MomentumAgent:
    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def analyze_momentum(self) -> dict:
        from models.task import Task
        from models.intelligence import ExecutionProfile
        from sqlalchemy import select

        session, engine = _sync_session()
        try:
            tasks = session.execute(select(Task)).scalars().all()
            completed = [t for t in tasks if t.status == "done"]
            pending   = [t for t in tasks if t.status != "done"]
            now = datetime.now(timezone.utc)
            overdue = sum(
                1 for t in pending
                if t.deadline and (t.deadline if t.deadline.tzinfo else t.deadline.replace(tzinfo=timezone.utc)) < now
            )
            total = len(tasks)
            if total == 0:
                momentum, consistency, burnout = 50, 50, 10
            else:
                cr = len(completed) / total
                momentum    = min(100, int(cr * 100))
                consistency = min(100, max(0, 100 - overdue * 10))
                burnout     = min(100, int(len(pending) / max(1, total) * 50))

            profile = session.execute(select(ExecutionProfile).limit(1)).scalar_one_or_none()
            if not profile:
                profile = ExecutionProfile()
                session.add(profile)
            profile.momentum_score    = momentum
            profile.consistency_score = consistency
            profile.burnout_risk      = burnout
            session.commit()
            session.refresh(profile)
            return profile.to_dict()
        finally:
            session.close(); engine.dispose()

    def generate_weekly_review(self) -> dict:
        from models.intelligence import WeeklyReview
        profile = self.analyze_momentum()
        try:
            res = self.gemini.generate_structured(
                f"You are the FocusOS System Intelligence. Analyze this execution profile and provide a short 2-sentence weekly review. Profile: {profile}.",
                {"type": "object", "properties": {"feedback": {"type": "string"}}},
            )
            feedback = res.get("feedback", "Keep up the good work.")
        except Exception:
            feedback = "System operating optimally."

        session, engine = _sync_session()
        try:
            review = WeeklyReview(tasks_completed=0, tasks_overdue=0, ai_feedback=feedback)
            session.add(review)
            session.commit()
            session.refresh(review)
            return review.to_dict()
        finally:
            session.close(); engine.dispose()
