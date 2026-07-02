"""FocusOS — Telemetry Models"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class ScenarioType(str, Enum):
    DELAY_TASK = "DELAY_TASK"
    SKIP_TASK = "SKIP_TASK"
    ADD_TASK = "ADD_TASK"
    REDUCE_HOURS = "REDUCE_HOURS"
    INCREASE_WORKLOAD = "INCREASE_WORKLOAD"
    MOVE_DEADLINE = "MOVE_DEADLINE"
    EXECUTE_INTERVENTION = "EXECUTE_INTERVENTION"


class AgentExecutionLog(Base):
    __tablename__ = "agent_execution_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_agentexecutionlog_user"), nullable=True, index=True)
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    metadata_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "agent_name": self.agent_name, "action": self.action,
            "status": self.status, "confidence": self.confidence,
            "execution_time_ms": self.execution_time_ms,
            "metadata_payload": self.metadata_payload,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TwinSimulationLog(Base):
    __tablename__ = "twin_simulation_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_twinsimulationlog_user"), nullable=True, index=True)
    scenario_type: Mapped[str] = mapped_column(String(50), nullable=False)
    current_success_probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    projected_success_probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    projected_risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    capacity_impact: Mapped[int | None] = mapped_column(Integer, nullable=True)
    schedule_stability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    scenario_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    simulation_result: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "scenario_type": self.scenario_type,
            "current_success_probability": self.current_success_probability,
            "projected_success_probability": self.projected_success_probability,
            "current_risk_score": self.current_risk_score,
            "projected_risk_score": self.projected_risk_score,
            "capacity_impact": self.capacity_impact,
            "schedule_stability": self.schedule_stability,
            "scenario_payload": self.scenario_payload,
            "simulation_result": self.simulation_result,
            "created_at": self.created_at.isoformat(),
        }


class OrchestratorEvent(Base):
    __tablename__ = "orchestrator_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", name="fk_orchestratorevent_user"), nullable=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    agent: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "agent": self.agent, "action": self.action,
            "status": self.status, "payload": self.payload,
        }
