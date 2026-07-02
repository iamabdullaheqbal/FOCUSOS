"""FocusOS — User Model"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    username: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    working_hours_start: Mapped[str] = mapped_column(String(10), default="09:00")
    working_hours_end: Mapped[str] = mapped_column(String(10), default="17:00")
    focus_hours_start: Mapped[str | None] = mapped_column(String(10), nullable=True)
    focus_hours_end: Mapped[str | None] = mapped_column(String(10), nullable=True)
    daily_capacity: Mapped[float] = mapped_column(Float, default=8.0)
    preferred_planning_mode: Mapped[str] = mapped_column(String(50), default="balanced")
    theme_preference: Mapped[str] = mapped_column(String(20), default="system")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="user", cascade="all, delete-orphan", lazy="select")
    goals: Mapped[list["Goal"]] = relationship("Goal", back_populates="user", cascade="all, delete-orphan", lazy="select")
    settings: Mapped["UserSettings | None"] = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def serialize(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "timezone": self.timezone,
            "country": self.country,
            "working_hours": {"start": self.working_hours_start, "end": self.working_hours_end},
            "focus_hours": {"start": self.focus_hours_start, "end": self.focus_hours_end},
            "daily_capacity": self.daily_capacity,
            "preferred_planning_mode": self.preferred_planning_mode,
            "theme_preference": self.theme_preference,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
