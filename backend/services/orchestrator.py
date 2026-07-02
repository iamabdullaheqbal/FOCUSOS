"""FocusOS — Agent Orchestration Service"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class OrchestratorService:
    """Coordinates multi-agent workflows and maintains the global activity feed."""

    def __init__(self, gemini_service):
        from agents.vision_agent import VisionAgent
        from agents.priority_agent import PriorityAgent
        from agents.planning_agent import PlanningAgent
        from agents.rescue_agent import RescueAgent
        from agents.digital_twin_agent import DigitalTwinAgent
        from agents.accountability_agent import AccountabilityAgent
        from agents.coach_agent import CoachAgent
        from agents.reflection_agent import ReflectionAgent

        self.gemini = gemini_service
        self.vision = VisionAgent(gemini_service)
        self.priority = PriorityAgent(gemini_service)
        self.planning = PlanningAgent(gemini_service)
        self.rescue = RescueAgent(gemini_service)
        self.twin = DigitalTwinAgent(gemini_service)
        self.accountability = AccountabilityAgent(gemini_service)
        self.coach = CoachAgent(gemini_service)
        self.reflection = ReflectionAgent(gemini_service)

    # ── Event bus ─────────────────────────────────────────────────────────────

    @classmethod
    def add_event(
        cls,
        agent: str,
        action: str,
        status: str,
        payload: Any = None,
        user_id: Optional[str] = None,
    ) -> None:
        from models.telemetry import OrchestratorEvent
        from sqlalchemy import select, func
        try:
            session, engine = _sync_session()
            with session:
                event = OrchestratorEvent(
                    user_id=user_id, agent=agent,
                    action=action, status=status, payload=payload,
                )
                session.add(event)

                # Keep feed to 500 rows per user
                count = session.execute(
                    select(func.count()).select_from(OrchestratorEvent)
                    .where(OrchestratorEvent.user_id == user_id)
                ).scalar() or 0
                if count >= 500:
                    oldest = session.execute(
                        select(OrchestratorEvent)
                        .where(OrchestratorEvent.user_id == user_id)
                        .order_by(OrchestratorEvent.timestamp.asc())
                        .limit(1)
                    ).scalar_one_or_none()
                    if oldest:
                        session.delete(oldest)

                session.commit()
            engine.dispose()
        except Exception as e:
            logger.error("Failed to save OrchestratorEvent: %s", e)

    @classmethod
    def get_feed(cls, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        from models.telemetry import OrchestratorEvent
        from sqlalchemy import select
        try:
            session, engine = _sync_session()
            with session:
                events = session.execute(
                    select(OrchestratorEvent)
                    .where(OrchestratorEvent.user_id == user_id)
                    .order_by(OrchestratorEvent.timestamp.desc())
                    .limit(100)
                ).scalars().all()
                result = [e.to_dict() for e in events]
            engine.dispose()
            return result
        except Exception as e:
            logger.error("get_feed failed: %s", e)
            return []

    # ── Full pipeline (image → all agents) ───────────────────────────────────

    def run_pipeline(
        self,
        image_bytes: bytes,
        mime_type: str,
        availability: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        import time
        from services.telemetry_service import TelemetryService
        from api.agents import _set

        trace: List[Dict] = []

        def _log(agent, action, status, data=None):
            self.add_event(agent, action, status, data, user_id)
            trace.append({"agent": agent, "action": action, "status": status, "data": data})

        logger.info("Starting Orchestrator Pipeline…")

        # 1. Vision
        _set("vision", "running")
        _log("Vision Agent", "Extracting tasks from image", "running")
        t0 = time.time()
        vision_result = self.vision.extract_tasks_from_image(image_bytes, mime_type)
        extracted_tasks = vision_result.get("tasks", [])
        _log("Vision Agent", f"Extracted {len(extracted_tasks)} tasks", "success", vision_result)
        TelemetryService.log_execution("Vision Agent", "Image Extraction", "success", t0, 95,
                                       {"task_count": len(extracted_tasks)}, user_id)
        _set("vision", "idle")

        if not extracted_tasks:
            return {"status": "error", "message": "No tasks found in image.", "trace": trace}

        # 2. Priority
        _set("priority", "running")
        _log("Priority Agent", "Calculating priority scores", "running")
        t0 = time.time()
        prioritized: List[Dict] = []
        for task in extracted_tasks:
            req = {"title": task.get("title", "Unknown"), "deadline": task.get("deadline", ""),
                   "description": task.get("description", ""), "estimated_hours": 2}
            score = self.priority.analyze_task(req, len(extracted_tasks))
            task["priority_score"] = score.get("priority_score", 50)
            prioritized.append(task)
        _log("Priority Agent", "Assigned priority scores", "success", prioritized)
        TelemetryService.log_execution("Priority Agent", "Priority Scoring", "success", t0, 90,
                                       {"task_count": len(prioritized)}, user_id)
        _set("priority", "idle")

        # 3. Planning
        _set("planning", "running")
        _log("Planning Agent", "Synthesizing schedule", "running")
        t0 = time.time()
        plan = self.planning.generate_plan(prioritized, availability)
        _log("Planning Agent", "Generated execution schedule", "success", plan)
        TelemetryService.log_execution("Planning Agent", "Schedule Synthesis", "success", t0, 85, user_id=user_id)
        _set("planning", "idle")

        # 4. Accountability
        _set("accountability", "running")
        _log("Accountability Agent", "Analyzing execution behavior", "running")
        t0 = time.time()
        accountability = self.accountability.generate_metrics(prioritized, [], [])
        _log("Accountability Agent", "Calculated metrics", "success", accountability)
        TelemetryService.log_execution("Accountability Agent", "Behavior Analysis", "success", t0, 80, user_id=user_id)
        _set("accountability", "idle")

        # 5. Coach
        _set("coach", "running")
        _log("Coach Agent", "Drafting coaching insights", "running")
        t0 = time.time()
        coach = self.coach.generate_coaching(prioritized, accountability)
        _log("Coach Agent", "Generated coaching plan", "success", coach)
        TelemetryService.log_execution("Coach Agent", "Coaching Insights", "success", t0, 88, user_id=user_id)
        _set("coach", "idle")

        # 6. Rescue
        _set("rescue", "running")
        _log("Rescue Agent", "Analysing schedule for critical risks", "running")
        t0 = time.time()
        rescue = self.rescue.generate_recovery_plan(prioritized, availability)
        status_label = "warning" if rescue.get("risk_detected") else "success"
        _log("Rescue Agent", "Risk analysis done", status_label, rescue)
        TelemetryService.log_execution("Rescue Agent", "Risk Detection", "success", t0, 92, user_id=user_id)
        _set("rescue", "idle")

        # 7. Digital Twin
        _set("twin", "running")
        _log("Digital Twin", "Simulating worst-case scenario", "running")
        t0 = time.time()
        critical = max(prioritized, key=lambda x: x.get("priority_score", 0))
        scenario = {"action": "delay_task", "task": critical["title"], "delay_days": 1}
        twin = self.twin.simulate_scenario(prioritized, scenario, availability)
        _log("Digital Twin", "Forecasted outcomes", "success", twin)
        TelemetryService.log_execution("Digital Twin Agent", "Simulation", "success", t0, 90, user_id=user_id)
        _set("twin", "idle")

        # 8. Reflection
        _set("reflection", "running")
        _log("Reflection Agent", "Synthesizing daily reflection", "running")
        t0 = time.time()
        reflection = self.reflection.generate_reflection(prioritized, twin)
        _log("Reflection Agent", "Generated reflection report", "success", reflection)
        TelemetryService.log_execution("Reflection Agent", "Daily Reflection", "success", t0, 85, user_id=user_id)
        _set("reflection", "idle")

        return {
            "status": "success",
            "pipeline_summary": "Full Intelligence Briefing complete.",
            "data": {
                "vision": vision_result, "tasks": prioritized, "schedule": plan,
                "accountability": accountability, "coach": coach,
                "rescue": rescue, "twin": twin, "reflection": reflection,
            },
            "trace": trace,
        }

    # ── System-state evaluation (DB-based, no image) ─────────────────────────

    def evaluate_system_state(self, user_id: str) -> Dict[str, Any]:
        import time
        from sqlalchemy import select
        from models.task import Task
        from models.intervention import Intervention
        from services.telemetry_service import TelemetryService
        from api.agents import _set

        trace: List[Dict] = []

        def _log(agent, action, status, data=None):
            self.add_event(agent, action, status, data, user_id)
            trace.append({"agent": agent, "action": action, "status": status})

        t_start = time.time()
        logger.info("Starting System Orchestration Evaluation…")

        # Fetch active tasks
        session, engine = _sync_session()
        try:
            rows = session.execute(
                select(Task)
                .where(Task.user_id == user_id, Task.status.in_(["pending", "in_progress"]))
            ).scalars().all()
            tasks = [t.to_dict() for t in rows]
        finally:
            session.close()
            engine.dispose()

        if not tasks:
            _log("System", "No active tasks found.", "success")
            return {"status": "success", "tasks_evaluated": 0, "priority_tasks": [],
                    "risk_level": "Low", "interventions_generated": 0,
                    "execution_time_ms": int((time.time() - t_start) * 1000), "trace": trace}

        avail = {"daily_available_hours": 6, "preferred_work_hours": {"start": "09:00", "end": "21:00"}}

        # Priority
        _set("priority", "running")
        t0 = time.time()
        try:
            for task in tasks:
                req = {"title": task.get("title", ""), "deadline": task.get("deadline", ""),
                       "description": task.get("description", ""), "estimated_hours": task.get("estimated_hours", 2)}
                score = self.priority.analyze_task(req, len(tasks))
                task["priority_score"] = score.get("priority_score", 50)
            _log("Priority Agent", "Priority scoring done", "success")
            TelemetryService.log_execution("Priority Agent", "System Priority Scoring", "success", t0, 95, user_id=user_id)
        except Exception as e:
            _log("Priority Agent", "Failed", "error")
            return {"status": "error", "failed_stage": "Priority Agent", "trace": trace}
        _set("priority", "idle")

        # Planning
        _set("planning", "running")
        t0 = time.time()
        try:
            plan = self.planning.generate_plan(tasks, avail)
            _log("Planning Agent", "Schedule generated", "success")
            TelemetryService.log_execution("Planning Agent", "System Schedule", "success", t0, 90, user_id=user_id)
        except Exception as e:
            _log("Planning Agent", "Failed", "error")
            return {"status": "error", "failed_stage": "Planning Agent", "trace": trace}
        _set("planning", "idle")

        # Rescue
        _set("rescue", "running")
        t0 = time.time()
        try:
            rescue = self.rescue.generate_recovery_plan(tasks, avail)
            _log("Rescue Agent", "Risk analysis done", "success")
            TelemetryService.log_execution("Rescue Agent", "System Risk Detection", "success", t0, 92, user_id=user_id)
        except Exception as e:
            _log("Rescue Agent", "Failed", "error")
            return {"status": "error", "failed_stage": "Rescue Agent", "trace": trace}
        _set("rescue", "idle")

        # Twin
        _set("twin", "running")
        t0 = time.time()
        try:
            critical = max(tasks, key=lambda x: x.get("priority_score", 0))
            scenario = {"action": "delay_task", "task": critical["title"], "delay_days": 1}
            twin = self.twin.simulate_scenario(tasks, scenario, avail)
            _log("Digital Twin", "Simulation complete", "success")
            TelemetryService.log_execution("Digital Twin Agent", "System Simulation", "success", t0, 88, user_id=user_id)
        except Exception as e:
            _log("Digital Twin", "Failed", "error")
            return {"status": "error", "failed_stage": "Digital Twin", "trace": trace}
        _set("twin", "idle")

        # Interventions
        _set("intervention", "running")
        generated = 0
        t0 = time.time()
        try:
            if rescue.get("risk_detected"):
                reason = rescue.get("recovery_plan", "High risk detected.")
                if isinstance(reason, list):
                    reason = " ".join(str(r) for r in reason) if reason else "High risk detected."

                session, engine = _sync_session()
                try:
                    inv = Intervention(
                        user_id=user_id, type="rescue",
                        severity=rescue.get("risk_level", "High"),
                        trigger_source="Rescue Agent Orchestration",
                        message=reason,
                        recommended_action={"action": "rebalance"},
                    )
                    session.add(inv)
                    session.commit()
                    generated = 1
                finally:
                    session.close()
                    engine.dispose()

            _log("Intervention Engine", f"{generated} interventions generated", "success")
            TelemetryService.log_execution("Intervention Engine", "System Interventions", "success", t0, 90, user_id=user_id)
        except Exception as e:
            _log("Intervention Engine", "Failed", "error")
        _set("intervention", "idle")

        return {
            "status": "success",
            "tasks_evaluated": len(tasks),
            "priority_tasks": tasks,
            "risk_level": "High" if rescue.get("risk_detected") else "Low",
            "interventions_generated": generated,
            "execution_time_ms": int((time.time() - t_start) * 1000),
            "trace": trace,
        }
