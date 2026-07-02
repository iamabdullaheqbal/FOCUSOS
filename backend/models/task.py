"""FocusOS — Task Model"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_task_user"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True, default=1.0)
    actual_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, default="work")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    source_file: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ai_confidence: Mapped[int | None] = mapped_column(Integer, nullable=True, default=92)
    goal_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    milestone_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    priority_score: Mapped[int | None] = mapped_column(Integer, nullable=True, default=50)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User | None"] = relationship("User", back_populates="tasks")

    @property
    def is_overdue(self) -> bool:
        now = datetime.now(timezone.utc)
        dl = self.deadline if self.deadline.tzinfo else self.deadline.replace(tzinfo=timezone.utc)
        return self.status not in ("done",) and now > dl

    @property
    def hours_until_deadline(self) -> float:
        now = datetime.now(timezone.utc)
        dl = self.deadline if self.deadline.tzinfo else self.deadline.replace(tzinfo=timezone.utc)
        return round((dl - now).total_seconds() / 3600, 2)

    @property
    def completion_percentage(self) -> float:
        if self.status == "done":
            return 100.0
        if not self.estimated_hours:
            return 0.0
        return min(round((self.actual_hours / self.estimated_hours) * 100, 1), 99.0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "estimated_hours": self.estimated_hours,
            "actual_hours": self.actual_hours,
            "category": self.category,
            "status": self.status,
            "source": self.source,
            "source_file": self.source_file,
            "ai_confidence": self.ai_confidence,
            "goal_id": self.goal_id,
            "milestone_id": self.milestone_id,
            "priority_score": self.priority_score,
            "is_overdue": self.is_overdue,
            "hours_until_deadline": self.hours_until_deadline,
            "completion_percentage": self.completion_percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
