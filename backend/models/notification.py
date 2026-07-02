"""FocusOS — Notification Model"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_notification_user"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="info")
    priority: Mapped[str] = mapped_column(String(20), default="info")
    module: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    action_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "title": self.title,
            "description": self.description, "severity": self.severity,
            "priority": self.priority, "module": self.module,
            "entity_type": self.entity_type, "entity_id": self.entity_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read": self.read, "action_url": self.action_url,
            "icon": self.icon, "color": self.color, "category": self.category,
        }
