"""FocusOS — Intervention, Threat, RescuePlan, RescueExecution Models"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    priority_score: Mapped[int] = mapped_column(Integer, default=0)
    confidence_score: Mapped[int] = mapped_column(Integer, default=0)
    trigger_source: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "type": self.type,
            "severity": self.severity, "priority_score": self.priority_score,
            "confidence_score": self.confidence_score, "trigger_source": self.trigger_source,
            "message": self.message, "recommended_action": self.recommended_action,
            "created_at": self.created_at.isoformat(), "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class Threat(Base):
    __tablename__ = "threats"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "type": self.type,
            "severity": self.severity, "source": self.source,
            "message": self.message, "details": self.details,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RescuePlan(Base):
    __tablename__ = "rescue_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    success_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    intervention: Mapped[list | None] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "success_rate": self.success_rate, "intervention": self.intervention,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class RescueExecution(Base):
    __tablename__ = "rescue_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    plan_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    user_response: Mapped[str | None] = mapped_column(String(50), nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
