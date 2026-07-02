"""FocusOS — User Settings Model"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    profile: Mapped[dict] = mapped_column(JSON, default=dict)
    appearance: Mapped[dict] = mapped_column(JSON, default=dict)
    notifications: Mapped[dict] = mapped_column(JSON, default=dict)
    planner: Mapped[dict] = mapped_column(JSON, default=dict)
    ai: Mapped[dict] = mapped_column(JSON, default=dict)
    security: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="settings")

    def serialize(self) -> dict:
        return {
            "user_id": self.user_id,
            "profile": self.profile or {},
            "appearance": self.appearance or {},
            "notifications": self.notifications or {},
            "planner": self.planner or {},
            "ai": self.ai or {},
            "security": self.security or {},
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
