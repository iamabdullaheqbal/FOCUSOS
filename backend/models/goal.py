"""FocusOS — Goal, Milestone, Habit, HabitLog Models"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_goal_user"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Active")
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    health_score: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[str] = mapped_column(String(50), default="Medium")
    duration: Mapped[str | None] = mapped_column(String(50), nullable=True)
    success_score: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User | None"] = relationship("User", back_populates="goals")
    milestones: Mapped[list["Milestone"]] = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan", lazy="select")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "title": self.title,
            "description": self.description, "category": self.category,
            "target_date": self.target_date, "status": self.status,
            "progress_percentage": self.progress_percentage, "health_score": self.health_score,
            "created_at": self.created_at.isoformat(), "archived": self.archived,
            "pinned": self.pinned, "priority": self.priority, "duration": self.duration,
            "success_score": self.success_score,
            "milestones": [m.to_dict() for m in self.milestones],
        }


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_milestone_user"), nullable=True, index=True)
    goal_id: Mapped[str] = mapped_column(String(36), ForeignKey("goals.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(50), default="NOT_STARTED")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    goal: Mapped["Goal"] = relationship("Goal", back_populates="milestones")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "goal_id": self.goal_id,
            "title": self.title, "target_date": self.target_date,
            "completed": self.completed, "status": self.status,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_habit_user"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    frequency: Mapped[str] = mapped_column(String(50), default="Daily")
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    completion_rate: Mapped[int] = mapped_column(Integer, default=0)
    momentum_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    status: Mapped[str] = mapped_column(String(50), default="Active")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_schedule: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_duration: Mapped[str | None] = mapped_column(String(50), nullable=True)
    last_checkin_date: Mapped[str | None] = mapped_column(String(50), nullable=True)

    logs: Mapped[list["HabitLog"]] = relationship("HabitLog", back_populates="habit_ref", cascade="all, delete-orphan", lazy="select")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "name": self.name,
            "category": self.category, "frequency": self.frequency,
            "current_streak": self.current_streak, "longest_streak": self.longest_streak,
            "completion_rate": self.completion_rate, "momentum_score": self.momentum_score,
            "created_at": self.created_at.isoformat(), "status": self.status,
            "archived": self.archived, "reminder_schedule": self.reminder_schedule,
            "target_duration": self.target_duration, "last_checkin_date": self.last_checkin_date,
            "logs": [l.to_dict() for l in self.logs],
        }


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_habitlog_user"), nullable=True, index=True)
    habit_id: Mapped[str] = mapped_column(String(36), ForeignKey("habits.id"), nullable=False)
    date: Mapped[str] = mapped_column(String(50), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    habit_ref: Mapped["Habit"] = relationship("Habit", back_populates="logs")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "habit_id": self.habit_id,
            "date": self.date, "completed": self.completed,
            "created_at": self.created_at.isoformat(),
        }
