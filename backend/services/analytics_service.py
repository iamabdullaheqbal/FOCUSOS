"""FocusOS — Analytics Service"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def _sync_session():
    """Return a sync SQLAlchemy session for use inside synchronous service methods."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class AnalyticsService:

    @classmethod
    def get_overview(cls, user_id: Optional[str] = None) -> Dict[str, Any]:
        try:
            from models.task import Task
            from models.intervention import Intervention
            from models.intelligence import AccountabilityMetrics
            from models.telemetry import AgentExecutionLog, TwinSimulationLog
            from sqlalchemy import select, func

            session, engine = _sync_session()
            with session:
                total = session.execute(select(func.count()).select_from(Task).where(Task.user_id == user_id)).scalar() or 0
                done  = session.execute(select(func.count()).select_from(Task).where(Task.user_id == user_id, Task.status == "done")).scalar() or 0
                completion_rate = int(done / total * 100) if total else 0

                avg_conf = session.execute(
                    select(func.avg(AgentExecutionLog.confidence)).where(AgentExecutionLog.user_id == user_id)
                ).scalar() or 0

                twin = session.execute(
                    select(TwinSimulationLog).where(TwinSimulationLog.user_id == user_id)
                    .order_by(TwinSimulationLog.created_at.desc()).limit(1)
                ).scalar_one_or_none()

                future_risk = "Low"
                if twin and twin.projected_risk_score:
                    r = twin.projected_risk_score
                    future_risk = "High" if r > 70 else "Medium" if r > 40 else "Low"

                acc = session.execute(
                    select(AccountabilityMetrics).where(AccountabilityMetrics.user_id == user_id)
                    .order_by(AccountabilityMetrics.created_at.desc()).limit(1)
                ).scalar_one_or_none()

            engine.dispose()
            return {
                "productivity_score": acc.productivity_score if acc else 0,
                "completion_rate": completion_rate,
                "deadline_success_rate": completion_rate,
                "current_risk_level": acc.risk_profile if acc else "Low",
                "future_risk_forecast": future_risk,
                "ai_confidence_score": int(avg_conf),
            }
        except Exception as e:
            logger.error("get_overview failed: %s", e)
            return {"productivity_score": 0, "completion_rate": 0, "deadline_success_rate": 0,
                    "current_risk_level": "Unknown", "future_risk_forecast": "Unknown", "ai_confidence_score": 0}

    @classmethod
    def get_productivity_trends(cls, user_id: Optional[str] = None) -> List[Dict]:
        try:
            from models.intelligence import AccountabilityMetrics
            from sqlalchemy import select
            session, engine = _sync_session()
            with session:
                rows = session.execute(
                    select(AccountabilityMetrics).where(AccountabilityMetrics.user_id == user_id)
                    .order_by(AccountabilityMetrics.created_at.desc()).limit(30)
                ).scalars().all()
            engine.dispose()
            rows.reverse()
            return [{"date": m.created_at.strftime("%Y-%m-%d"), "productivity": m.productivity_score,
                     "completion": m.completion_rate, "procrastination": m.procrastination_score,
                     "consistency": m.consistency_score} for m in rows]
        except Exception as e:
            logger.error("get_productivity_trends failed: %s", e)
            return []

    @classmethod
    def get_agent_contributions(cls, user_id: Optional[str] = None) -> List[Dict]:
        try:
            from models.telemetry import AgentExecutionLog
            from sqlalchemy import select, func
            session, engine = _sync_session()
            with session:
                rows = session.execute(
                    select(AgentExecutionLog.agent_name, func.count(AgentExecutionLog.id).label("cnt"))
                    .where(AgentExecutionLog.user_id == user_id)
                    .group_by(AgentExecutionLog.agent_name)
                ).all()
            engine.dispose()
            return [{"agent": r.agent_name, "uses": r.cnt} for r in rows]
        except Exception as e:
            logger.error("get_agent_contributions failed: %s", e)
            return []

    @classmethod
    def get_intelligence_reports(cls, user_id: Optional[str] = None) -> Dict:
        try:
            from models.intelligence import CoachReport, ReflectionReport
            from sqlalchemy import select
            session, engine = _sync_session()
            with session:
                coach = session.execute(
                    select(CoachReport).where(CoachReport.user_id == user_id)
                    .order_by(CoachReport.created_at.desc()).limit(1)
                ).scalar_one_or_none()
                reflection = session.execute(
                    select(ReflectionReport).where(ReflectionReport.user_id == user_id)
                    .order_by(ReflectionReport.created_at.desc()).limit(1)
                ).scalar_one_or_none()
            engine.dispose()
            return {"coach": coach.to_dict() if coach else {}, "reflection": reflection.to_dict() if reflection else {}}
        except Exception as e:
            logger.error("get_intelligence_reports failed: %s", e)
            return {"coach": {}, "reflection": {}}

    @classmethod
    def get_productivity_heatmap(cls, user_id: Optional[str] = None) -> List:
        return []

    @classmethod
    def generate_chief_of_staff_briefing(cls, user_id: Optional[str] = None) -> str:
        try:
            overview = cls.get_overview(user_id)
            prod = overview.get("productivity_score", 0)
            risk = overview.get("future_risk_forecast", "Unknown")
            interv_str = ""
            try:
                from models.intervention import Intervention
                from sqlalchemy import select, func
                session, engine = _sync_session()
                with session:
                    open_count = session.execute(
                        select(func.count()).select_from(Intervention)
                        .where(Intervention.user_id == user_id, Intervention.resolved == False)
                    ).scalar() or 0
                engine.dispose()
                if open_count:
                    interv_str = f" {open_count} open interventions require attention."
            except Exception:
                pass
            return (f"System operations are active with a productivity score of {prod}%. "
                    f"Future risk is currently assessed as {risk}.{interv_str}")
        except Exception as e:
            logger.error("generate_chief_of_staff_briefing failed: %s", e)
            return "System operations nominal. Future risk assessment unavailable."

    @classmethod
    def get_agent_metrics(cls, agent_name: str, user_id: Optional[str] = None) -> Dict:
        try:
            from models.telemetry import AgentExecutionLog
            from sqlalchemy import select, func
            session, engine = _sync_session()
            with session:
                logs = session.execute(
                    select(AgentExecutionLog)
                    .where(AgentExecutionLog.user_id == user_id, AgentExecutionLog.agent_name == agent_name)
                ).scalars().all()
                avg_time = session.execute(
                    select(func.avg(AgentExecutionLog.execution_time_ms))
                    .where(AgentExecutionLog.user_id == user_id, AgentExecutionLog.agent_name == agent_name)
                ).scalar() or 0
                avg_conf = session.execute(
                    select(func.avg(AgentExecutionLog.confidence))
                    .where(AgentExecutionLog.user_id == user_id, AgentExecutionLog.agent_name == agent_name)
                ).scalar() or 0
            engine.dispose()
            total = len(logs)
            successes = sum(1 for l in logs if l.status == "success")
            success_rate = int(successes / total * 100) if total else 0
            return {"total_executions": total, "success_rate": success_rate,
                    "failure_rate": 100 - success_rate, "average_execution_ms": int(avg_time),
                    "average_confidence": int(avg_conf),
                    "history": [l.to_dict() for l in logs[-10:]]}
        except Exception as e:
            logger.error("get_agent_metrics failed: %s", e)
            return {"total_executions": 0, "success_rate": 0, "failure_rate": 0,
                    "average_execution_ms": 0, "average_confidence": 0, "history": []}

    @classmethod
    def get_intervention_metrics(cls, user_id: Optional[str] = None) -> Dict:
        try:
            from models.intervention import Intervention
            from sqlalchemy import select, func
            session, engine = _sync_session()
            with session:
                total    = session.execute(select(func.count()).select_from(Intervention).where(Intervention.user_id == user_id)).scalar() or 0
                resolved = session.execute(select(func.count()).select_from(Intervention).where(Intervention.user_id == user_id, Intervention.resolved == True)).scalar() or 0
            engine.dispose()
            return {"total_generated": total, "resolved": resolved,
                    "resolution_rate": int(resolved / total * 100) if total else 0,
                    "active": total - resolved}
        except Exception as e:
            logger.error("get_intervention_metrics failed: %s", e)
            return {"total_generated": 0, "resolved": 0, "resolution_rate": 0, "active": 0}

    @classmethod
    def get_twin_accuracy(cls, user_id: Optional[str] = None) -> Dict:
        try:
            from models.telemetry import TwinSimulationLog
            from sqlalchemy import select, func
            session, engine = _sync_session()
            with session:
                total    = session.execute(select(func.count()).select_from(TwinSimulationLog).where(TwinSimulationLog.user_id == user_id)).scalar() or 0
                avg_imp  = session.execute(select(func.avg(TwinSimulationLog.capacity_impact)).where(TwinSimulationLog.user_id == user_id)).scalar() or 0
                recent   = session.execute(select(TwinSimulationLog).where(TwinSimulationLog.user_id == user_id).order_by(TwinSimulationLog.created_at.desc()).limit(5)).scalars().all()
            engine.dispose()
            return {"total_simulations": total, "average_capacity_impact": int(avg_imp),
                    "recent_simulations": [l.to_dict() for l in reversed(recent)]}
        except Exception as e:
            logger.error("get_twin_accuracy failed: %s", e)
            return {"total_simulations": 0, "average_capacity_impact": 0, "recent_simulations": []}

    @classmethod
    def get_insights(cls, user_id: Optional[str] = None) -> Dict:
        try:
            from models.intelligence import AccountabilityMetrics
            from models.telemetry import AgentExecutionLog
            from models.intervention import Intervention
            from sqlalchemy import select, func
            session, engine = _sync_session()
            with session:
                acc = session.execute(
                    select(AccountabilityMetrics).where(AccountabilityMetrics.user_id == user_id)
                    .order_by(AccountabilityMetrics.created_at.desc()).limit(1)
                ).scalar_one_or_none()
                counts = session.execute(
                    select(AgentExecutionLog.agent_name,
                           func.count(AgentExecutionLog.id).label("total"),
                           func.avg(AgentExecutionLog.confidence).label("avg_conf"))
                    .where(AgentExecutionLog.user_id == user_id)
                    .group_by(AgentExecutionLog.agent_name)
                ).all()
            engine.dispose()

            most_used = max(counts, key=lambda x: x.total or 0).agent_name if counts else "N/A"
            most_acc  = max(counts, key=lambda x: x.avg_conf or 0).agent_name if counts else "N/A"
            findings  = acc.key_findings if acc and isinstance(acc.key_findings, list) else []

            return {
                "top_risk": findings[0] if findings else "N/A",
                "top_opportunity": findings[1] if len(findings) > 1 else "N/A",
                "most_used_agent": most_used,
                "most_accurate_agent": most_acc,
                "recommended_focus_area": (acc.recommendations[0] if acc and isinstance(acc.recommendations, list) and acc.recommendations else "Define new goals"),
                "productivity": [], "completion_velocity": [], "habit_consistency": [],
                "intervention_metrics": {}, "agent_metrics": {},
                "summary": {"productivity_score": acc.productivity_score if acc else 0,
                            "success_probability": 0, "future_risk": "LOW"},
            }
        except Exception as e:
            logger.error("get_insights failed: %s", e)
            return {"top_risk": "N/A", "top_opportunity": "N/A", "most_used_agent": "N/A",
                    "most_accurate_agent": "N/A", "recommended_focus_area": "Define new goals",
                    "productivity": [], "completion_velocity": [], "habit_consistency": [],
                    "intervention_metrics": {}, "agent_metrics": {},
                    "summary": {"productivity_score": 0, "success_probability": 0, "future_risk": "LOW"}}
