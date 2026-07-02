"""FocusOS — Goal Service (sync, psycopg2 fallback)"""

import logging
import datetime as dt
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class GoalService:

    @classmethod
    def get_goals(cls, user_id: str, page: int = 1, limit: int = 100) -> List[Dict]:
        from models.goal import Goal
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            rows = session.execute(
                select(Goal).where(Goal.user_id == user_id)
                .options(selectinload(Goal.milestones))
                .order_by(Goal.pinned.desc(), Goal.created_at.desc())
                .offset((page - 1) * limit).limit(limit)
            ).scalars().all()
            return [g.to_dict() for g in rows]
        finally:
            session.close(); engine.dispose()

    @classmethod
    def get_habits(cls, user_id: str, page: int = 1, limit: int = 100) -> List[Dict]:
        from models.goal import Habit
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            habits = session.execute(
                select(Habit).where(Habit.user_id == user_id)
                .options(selectinload(Habit.logs))
                .offset((page - 1) * limit).limit(limit)
            ).scalars().all()
            today = datetime.now(timezone.utc).date()
            for h in habits:
                if h.last_checkin_date and h.status != "Paused":
                    last = datetime.strptime(h.last_checkin_date, "%Y-%m-%d").date()
                    if (today - last).days > 1:
                        h.current_streak = 0
            session.commit()
            return [h.to_dict() for h in habits]
        finally:
            session.close(); engine.dispose()

    @classmethod
    def create_goal(cls, user_id: str, title: str, description: str, category: str, target_date: Optional[str], gemini_service=None) -> Dict:
        from models.goal import Goal, Milestone
        from models.task import Task
        from agents.goal_agent import GoalAgent
        from sqlalchemy import select

        session, engine = _sync_session()
        try:
            # Duplicate check (last 30s)
            threshold = datetime.now(timezone.utc) - dt.timedelta(seconds=30)
            dup = session.execute(
                select(Goal).where(Goal.user_id == user_id, Goal.title == title, Goal.created_at >= threshold)
            ).scalar_one_or_none()
            if dup:
                raise ValueError(f"Duplicate request: Goal '{title}' was recently created.")

            agent_data = {}
            if gemini_service:
                try:
                    agent_data = GoalAgent(gemini_service).analyze_goal(title, description)
                except Exception as e:
                    logger.warning("GoalAgent failed, proceeding without AI data: %s", e)

            goal = Goal(
                user_id=user_id, title=title, description=description,
                category=category, target_date=target_date,
                health_score=100 if agent_data.get("goal_health") == "Excellent" else 80,
                progress_percentage=0, status="Active",
            )
            session.add(goal)
            session.flush()

            for idx, m_title in enumerate(agent_data.get("milestones", [])):
                m = Milestone(user_id=user_id, goal_id=goal.id, title=m_title)
                session.add(m)
                session.flush()
                deadline = dt.datetime.now(timezone.utc) + dt.timedelta(days=(idx + 1) * 7)
                task = Task(
                    user_id=user_id, title=m_title,
                    description=f"Generated from Goal: {title}",
                    deadline=deadline, estimated_hours=2.0,
                    category=category, source="goal",
                    goal_id=goal.id, milestone_id=m.id,
                )
                session.add(task)

            session.commit()
            session.refresh(goal)
            result = goal.to_dict()
            result["ai_forecast"] = agent_data
            return result
        finally:
            session.close(); engine.dispose()

    @classmethod
    def edit_goal(cls, user_id: str, goal_id: str, data: Dict) -> Dict:
        from models.goal import Goal
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            goal = session.execute(
                select(Goal).where(Goal.user_id == user_id, Goal.id == goal_id)
                .options(selectinload(Goal.milestones))
            ).scalar_one_or_none()
            if not goal:
                raise ValueError("Goal not found")
            for f in ("title", "description", "category", "target_date", "priority"):
                if f in data:
                    setattr(goal, f, data[f])
            session.commit()
            session.refresh(goal)
            return goal.to_dict()
        finally:
            session.close(); engine.dispose()

    @classmethod
    def archive_goal(cls, user_id: str, goal_id: str) -> bool:
        return cls._set_bool(user_id, goal_id, "archived", True, "Goal")

    @classmethod
    def unarchive_goal(cls, user_id: str, goal_id: str) -> bool:
        return cls._set_bool(user_id, goal_id, "archived", False, "Goal")

    @classmethod
    def toggle_pin_goal(cls, user_id: str, goal_id: str) -> bool:
        from models.goal import Goal
        from sqlalchemy import select
        session, engine = _sync_session()
        try:
            goal = session.execute(select(Goal).where(Goal.user_id == user_id, Goal.id == goal_id)).scalar_one_or_none()
            if not goal:
                return False
            goal.pinned = not goal.pinned
            session.commit()
            return True
        finally:
            session.close(); engine.dispose()

    @classmethod
    def delete_goal(cls, user_id: str, goal_id: str) -> bool:
        from models.goal import Goal
        from models.task import Task
        from sqlalchemy import select, delete
        session, engine = _sync_session()
        try:
            goal = session.execute(select(Goal).where(Goal.user_id == user_id, Goal.id == goal_id)).scalar_one_or_none()
            if not goal:
                return False
            session.execute(delete(Task).where(Task.user_id == user_id, Task.goal_id == goal_id))
            session.delete(goal)
            session.commit()
            return True
        finally:
            session.close(); engine.dispose()

    @classmethod
    def update_milestone_status(cls, user_id: str, milestone_id: str, status: str) -> Dict:
        from models.goal import Milestone, Goal
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            m = session.execute(select(Milestone).where(Milestone.id == milestone_id)).scalar_one_or_none()
            if not m:
                raise ValueError("Milestone not found")
            goal = session.execute(
                select(Goal).where(Goal.user_id == user_id, Goal.id == m.goal_id)
                .options(selectinload(Goal.milestones))
            ).scalar_one_or_none()
            if not goal:
                raise ValueError("Unauthorized or Goal not found")
            m.status = status
            m.completed = (status == "COMPLETED")
            m.completed_at = datetime.now(timezone.utc) if m.completed else None
            session.flush()
            total = len(goal.milestones)
            done  = sum(1 for x in goal.milestones if x.completed)
            goal.progress_percentage = int(done / total * 100) if total else 0
            if goal.progress_percentage == 100:
                goal.status = "COMPLETED"; goal.success_score = 100
            elif goal.progress_percentage > 0:
                goal.status = "IN_PROGRESS"
            session.commit()
            session.refresh(m)
            return m.to_dict()
        finally:
            session.close(); engine.dispose()

    @classmethod
    def create_habit(cls, user_id: str, name: str, category: str, frequency: str) -> Dict:
        from models.goal import Habit
        from sqlalchemy import select
        session, engine = _sync_session()
        try:
            threshold = datetime.now(timezone.utc) - dt.timedelta(seconds=30)
            dup = session.execute(select(Habit).where(Habit.user_id == user_id, Habit.name == name, Habit.created_at >= threshold)).scalar_one_or_none()
            if dup:
                raise ValueError(f"Duplicate request: Habit '{name}' was recently created.")
            habit = Habit(user_id=user_id, name=name, category=category, frequency=frequency)
            session.add(habit)
            session.commit()
            session.refresh(habit)
            return habit.to_dict()
        finally:
            session.close(); engine.dispose()

    @classmethod
    def edit_habit(cls, user_id: str, habit_id: str, data: Dict) -> Dict:
        from models.goal import Habit
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            habit = session.execute(
                select(Habit).where(Habit.user_id == user_id, Habit.id == habit_id)
                .options(selectinload(Habit.logs))
            ).scalar_one_or_none()
            if not habit:
                raise ValueError("Habit not found")
            for f in ("name", "category", "frequency", "reminder_schedule", "target_duration"):
                if f in data:
                    setattr(habit, f, data[f])
            session.commit()
            session.refresh(habit)
            return habit.to_dict()
        finally:
            session.close(); engine.dispose()

    @classmethod
    def archive_habit(cls, user_id: str, habit_id: str) -> bool:
        return cls._set_bool(user_id, habit_id, "archived", True, "Habit")

    @classmethod
    def unarchive_habit(cls, user_id: str, habit_id: str) -> bool:
        return cls._set_bool(user_id, habit_id, "archived", False, "Habit")

    @classmethod
    def delete_habit(cls, user_id: str, habit_id: str) -> bool:
        from models.goal import Habit, HabitLog
        from sqlalchemy import select, delete
        session, engine = _sync_session()
        try:
            habit = session.execute(select(Habit).where(Habit.user_id == user_id, Habit.id == habit_id)).scalar_one_or_none()
            if not habit:
                return False
            session.execute(delete(HabitLog).where(HabitLog.habit_id == habit_id))
            session.delete(habit)
            session.commit()
            return True
        finally:
            session.close(); engine.dispose()

    @classmethod
    def set_habit_status(cls, user_id: str, habit_id: str, status: str) -> Dict:
        from models.goal import Habit
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            habit = session.execute(
                select(Habit).where(Habit.user_id == user_id, Habit.id == habit_id)
                .options(selectinload(Habit.logs))
            ).scalar_one_or_none()
            if not habit:
                raise ValueError("Habit not found")
            habit.status = status
            session.commit()
            session.refresh(habit)
            return habit.to_dict()
        finally:
            session.close(); engine.dispose()

    @classmethod
    def check_in_habit(cls, user_id: str, habit_id: str) -> Dict:
        from models.goal import Habit, HabitLog
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        session, engine = _sync_session()
        try:
            habit = session.execute(
                select(Habit).where(Habit.user_id == user_id, Habit.id == habit_id)
                .options(selectinload(Habit.logs))
            ).scalar_one_or_none()
            if not habit:
                raise ValueError("Habit not found")
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            existing = session.execute(
                select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.date == today)
            ).scalar_one_or_none()
            if existing:
                raise ValueError("Already checked in today.")
            log = HabitLog(user_id=user_id, habit_id=habit_id, date=today, completed=True)
            session.add(log)
            habit.last_checkin_date = today
            habit.current_streak = (habit.current_streak or 0) + 1
            habit.longest_streak = max(habit.longest_streak or 0, habit.current_streak)
            habit.completion_rate = min(100, (habit.completion_rate or 0) + 5)
            habit.momentum_score = min(100, (habit.momentum_score or 0) + 10)
            session.commit()
            session.refresh(habit)
            return {"habit": habit.to_dict(), "log": log.to_dict()}
        finally:
            session.close(); engine.dispose()

    # ── helpers ───────────────────────────────────────────────────────────────

    @classmethod
    def _set_bool(cls, user_id: str, item_id: str, field: str, value: bool, kind: str) -> bool:
        from models.goal import Goal, Habit
        from sqlalchemy import select
        Model = Goal if kind == "Goal" else Habit
        session, engine = _sync_session()
        try:
            obj = session.execute(select(Model).where(Model.user_id == user_id, Model.id == item_id)).scalar_one_or_none()
            if not obj:
                return False
            setattr(obj, field, value)
            session.commit()
            return True
        finally:
            session.close(); engine.dispose()
