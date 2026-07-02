"""FocusOS — Intelligence Models (Accountability, Coach, Reflection)"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class AccountabilityMetrics(Base):
    __tablename__ = "accountability_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_accountability_user"), nullable=True, index=True)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    consistency_score: Mapped[float] = mapped_column(Float, default=0.0)
    procrastination_score: Mapped[float] = mapped_column(Float, default=0.0)
    productivity_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_profile: Mapped[str | None] = mapped_column(String(100), nullable=True)
    key_findings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "completion_rate": self.completion_rate, "consistency_score": self.consistency_score,
            "procrastination_score": self.procrastination_score, "productivity_score": self.productivity_score,
            "risk_profile": self.risk_profile, "key_findings": self.key_findings,
            "recommendations": self.recommendations, "created_at": self.created_at.isoformat(),
        }


class CoachReport(Base):
    __tablename__ = "coach_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_coachreport_user"), nullable=True, index=True)
    strengths: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    insights: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    improvement_plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    weekly_challenge: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendations: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "strengths": self.strengths, "weaknesses": self.weaknesses,
            "insights": self.insights, "improvement_plan": self.improvement_plan,
            "weekly_challenge": self.weekly_challenge, "recommendations": self.recommendations,
            "created_at": self.created_at.isoformat(),
        }


class ReflectionReport(Base):
    __tablename__ = "reflection_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_reflection_user"), nullable=True, index=True)
    achievements: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    missed_opportunities: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    lessons_learned: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    tomorrow_priorities: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    daily_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "achievements": self.achievements, "missed_opportunities": self.missed_opportunities,
            "lessons_learned": self.lessons_learned, "tomorrow_priorities": self.tomorrow_priorities,
            "daily_summary": self.daily_summary, "created_at": self.created_at.isoformat(),
        }


class ExecutionProfile(Base):
    __tablename__ = "execution_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_executionprofile_user"), nullable=True, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    momentum_score: Mapped[int] = mapped_column(Integer, default=50)
    burnout_risk: Mapped[int] = mapped_column(Integer, default=10)
    consistency_score: Mapped[int] = mapped_column(Integer, default=50)
    preferred_chunk_size: Mapped[int] = mapped_column(Integer, default=60)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "updated_at": self.updated_at.isoformat(),
            "momentum_score": self.momentum_score, "burnout_risk": self.burnout_risk,
            "consistency_score": self.consistency_score, "preferred_chunk_size": self.preferred_chunk_size,
        }


class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_weeklyreview_user"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_overdue: Mapped[int] = mapped_column(Integer, default=0)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "tasks_completed": self.tasks_completed, "tasks_overdue": self.tasks_overdue,
            "ai_feedback": self.ai_feedback,
        }


class CommandLog(Base):
    __tablename__ = "command_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_commandlog_user"), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    detected_intent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    execution_outcome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id, "source": self.source,
            "transcript": self.transcript, "detected_intent": self.detected_intent,
            "confidence_score": self.confidence_score, "execution_outcome": self.execution_outcome,
            "created_at": self.created_at.isoformat(),
        }
