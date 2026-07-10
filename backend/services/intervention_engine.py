"""FocusOS — Intervention Engine (sync, called from async routes)"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class InterventionEngine:

    @classmethod
    def run_engine(cls, user_id: Optional[str] = None) -> List[Dict]:
        import time
        from models.task import Task
        from models.intervention import Threat
        from services.availability_service import AvailabilityService
        from services.telemetry_service import TelemetryService
        from sqlalchemy import select

        t0 = time.time()
        if not user_id:
            return []

        session, engine = _sync_session()
        try:
            now = datetime.now(timezone.utc)
            overdue = session.execute(
                select(Task).where(Task.user_id == user_id, Task.status == "pending", Task.deadline < now)
            ).scalars().all()

            active_threats = session.execute(
                select(Threat).where(Threat.user_id == user_id, Threat.status == "active")
            ).scalars().all()
            active_msgs  = [t.message for t in active_threats]
            active_types = {t.type for t in active_threats}

            new_threats = []

            # 1. Overdue tasks → deadline_collision
            for task in overdue:
                if not any(task.title in m for m in active_msgs):
                    t = Threat(user_id=user_id, type="deadline_collision", severity="Critical",
                               source="Planner", message=f"Task '{task.title}' is overdue.",
                               details={"task_id": task.id})
                    new_threats.append(t)
                    active_msgs.append(t.message)

            # 2. Capacity overload
            avail = AvailabilityService.get_current_availability()
            if avail.get("utilization_percentage", 0) > 95 and "capacity_overload" not in active_types:
                t = Threat(user_id=user_id, type="capacity_overload", severity="High",
                           source="Planner",
                           message=f"Workload capacity at {avail['utilization_percentage']}%. Burnout risk high.",
                           details=avail)
                new_threats.append(t)
                active_types.add("capacity_overload")

            # 3. Goal drift — goals whose status is 'at_risk'
            from models.goal import Goal
            at_risk_goals = session.execute(
                select(Goal).where(Goal.user_id == user_id, Goal.status == "at_risk")
            ).scalars().all()
            for goal in at_risk_goals:
                if not any(goal.title in m for m in active_msgs):
                    t = Threat(
                        user_id=user_id, type="goal_drift", severity="Medium",
                        source="Goals",
                        message=f"Goal '{goal.title}' is deviating from its target trajectory.",
                        details={"goal_id": goal.id},
                    )
                    new_threats.append(t)
                    active_msgs.append(t.message)

            # 4. Habit degradation — habits with a broken streak (current_streak < 1)
            from models.goal import Habit
            broken_habits = session.execute(
                select(Habit).where(
                    Habit.user_id == user_id,
                    Habit.archived == False,  # noqa: E712
                    Habit.current_streak < 1,
                )
            ).scalars().all()
            for habit in broken_habits:
                if not any(habit.name in m for m in active_msgs):
                    t = Threat(
                        user_id=user_id, type="habit_degradation", severity="Low",
                        source="Habits",
                        message=f"Habit streak for '{habit.name}' has been broken.",
                        details={"habit_id": habit.id},
                    )
                    new_threats.append(t)
                    active_msgs.append(t.message)

            if new_threats:
                session.add_all(new_threats)
                session.commit()

            TelemetryService.log_execution("Threat Detection Engine", "Run Evaluation", "success", t0, 95, user_id=user_id)

            active = session.execute(
                select(Threat).where(Threat.user_id == user_id, Threat.status == "active")
                .order_by(Threat.created_at.desc())
            ).scalars().all()
            return [t.to_dict() for t in active]
        except Exception as e:
            logger.error("run_engine failed: %s", e)
            return []
        finally:
            session.close()
            engine.dispose()

    @classmethod
    def get_active_threats(cls, user_id: Optional[str] = None, page: int = 1, limit: int = 100) -> List[Dict]:
        from models.intervention import Threat
        from sqlalchemy import select
        session, engine = _sync_session()
        try:
            rows = session.execute(
                select(Threat).where(Threat.user_id == user_id, Threat.status == "active")
                .order_by(Threat.created_at.desc())
                .offset((page - 1) * limit).limit(limit)
            ).scalars().all()
            return [t.to_dict() for t in rows]
        except Exception as e:
            logger.error("get_active_threats failed: %s", e)
            return []
        finally:
            session.close()
            engine.dispose()

    @classmethod
    def resolve_intervention(cls, intervention_id: str, user_id: Optional[str] = None) -> bool:
        from models.intervention import Threat
        from sqlalchemy import select
        session, engine = _sync_session()
        try:
            threat = session.execute(select(Threat).where(Threat.id == intervention_id)).scalar_one_or_none()
            if threat:
                threat.status = "resolved"
                session.commit()
                return True
            return False
        except Exception as e:
            logger.error("resolve_intervention failed: %s", e)
            return False
        finally:
            session.close()
            engine.dispose()

    @classmethod
    def trigger_evaluation(cls, user_id: Optional[str] = None):
        try:
            cls.run_engine(user_id)
        except Exception as e:
            logger.error("trigger_evaluation failed: %s", e)
