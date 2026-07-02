"""FocusOS — Schedule & ScheduleSlot Models"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
import json


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_schedule_user"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    target_date: Mapped[str] = mapped_column(String(10), nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    sys_confidence: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    daily_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    strategy: Mapped[str | None] = mapped_column(String(50), nullable=True)
    available_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    generated_by: Mapped[str] = mapped_column(String(50), default="local")
    planning_brief: Mapped[str | None] = mapped_column(Text, nullable=True)
    twin_simulation: Mapped[str | None] = mapped_column(Text, nullable=True)
    backlog: Mapped[str | None] = mapped_column(Text, nullable=True)

    slots: Mapped[list["ScheduleSlot"]] = relationship(
        "ScheduleSlot", back_populates="schedule",
        cascade="all, delete-orphan", lazy="select",
        order_by="ScheduleSlot.start_time"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "target_date": self.target_date,
            "confidence_score": self.confidence_score,
            "sys_confidence": self.sys_confidence,
            "daily_summary": self.daily_summary,
            "strategy": self.strategy,
            "available_hours": self.available_hours,
            "version": self.version,
            "generated_by": self.generated_by,
            "planning_brief": json.loads(self.planning_brief) if self.planning_brief else [],
            "twin_simulation": json.loads(self.twin_simulation) if self.twin_simulation else None,
            "backlog": json.loads(self.backlog) if self.backlog else [],
            "schedule": [s.to_dict() for s in self.slots],
        }


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_scheduleslot_user"), nullable=True, index=True)
    schedule_id: Mapped[str] = mapped_column(String(36), ForeignKey("schedules.id"), nullable=False)
    task_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    task_title: Mapped[str] = mapped_column(String(200), nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)
    focus_block: Mapped[bool] = mapped_column(Boolean, default=False)
    is_break: Mapped[bool] = mapped_column(Boolean, default=False)

    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="slots")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "task_id": self.task_id,
            "task": self.task_title, "start_time": self.start_time,
            "end_time": self.end_time, "focus_block": self.focus_block,
            "is_break": self.is_break,
        }
