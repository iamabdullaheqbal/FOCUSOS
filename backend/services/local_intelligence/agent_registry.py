"""FocusOS — Agent Registry (no Flask dependency)"""

from typing import Dict, Any, Callable, Optional


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class AgentRegistry:
    _registry: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def register(cls, target_agent: str, executor_func: Callable):
        cls._registry[target_agent] = {"execute": executor_func}

    @classmethod
    def get_executor(cls, target_agent: str) -> Optional[Callable]:
        return (cls._registry.get(target_agent) or {}).get("execute")


# ── Executors ─────────────────────────────────────────────────────────────────

def navigate_executor(entities: Dict, context: Dict) -> Dict:
    target = entities.get("target_name", "").lower()
    valid  = {"dashboard", "settings", "goals", "planner", "calendar",
              "rescue", "analytics", "documents", "vision"}
    route  = f"/{target}" if target in valid else "/dashboard"
    label  = target if target in valid else "Dashboard"
    return {"action": "navigate", "route": route, "status": "Navigation requested",
            "message": f"Opening {label}."}


def focus_mode_executor(entities: Dict, context: Dict) -> Dict:
    return {"action": "navigate", "route": "/rescue", "status": "Focus Mode requested",
            "message": "Entering Focus Mode in the Rescue Center."}


def task_service_executor(entities: Dict, context: Dict) -> Dict:
    from models.task import Task
    from services.orchestrator import OrchestratorService
    from sqlalchemy import select
    from datetime import datetime, timezone, timedelta

    uid        = context.get("user_id")
    task_title = entities.get("target_name", "New Task")
    target_date = entities.get("target_date")
    confidence  = context.get("confidence", 90)

    try:
        deadline = datetime.fromisoformat(target_date) if target_date else datetime.now(timezone.utc) + timedelta(days=1)
    except Exception:
        deadline = datetime.now(timezone.utc) + timedelta(days=1)

    session, engine = _sync_session()
    try:
        existing = session.execute(
            select(Task).where(Task.user_id == uid, Task.title == task_title)
        ).scalar_one_or_none()
        if existing:
            OrchestratorService.add_event("Local Intelligence", "Prevented duplicate task", "warning",
                                          {"title": task_title}, uid)
            return {"action": "none", "status": "Task already exists",
                    "message": f"You already have a task named '{task_title}'."}
        t = Task(user_id=uid, title=task_title, deadline=deadline,
                 status="pending", source=context.get("source", "unknown"),
                 ai_confidence=confidence)
        session.add(t)
        session.commit()
        session.refresh(t)
        OrchestratorService.add_event("Local Intelligence", "Created Task", "success",
                                      {"task_id": t.id}, uid)
        return {"action": "create_task", "status": "Task created",
                "message": f"Added '{task_title}' to your tasks."}
    finally:
        session.close(); engine.dispose()


def goal_service_executor(entities: Dict, context: Dict) -> Dict:
    from services.goal_service import GoalService
    from services.orchestrator import OrchestratorService
    uid        = context.get("user_id")
    goal_title = entities.get("target_name", "New Goal")
    res = GoalService.create_goal(
        uid, goal_title,
        f"Created via {context.get('source', 'local intelligence')}.",
        "General", entities.get("target_date"),
        gemini_service=context.get("gemini_service"),
    )
    OrchestratorService.add_event("Local Intelligence", "Created Goal", "success",
                                  {"goal_id": res.get("id")}, uid)
    return {"action": "create_goal", "status": "Goal created",
            "message": f"Goal '{goal_title}' created."}


def rescue_agent_executor(entities: Dict, context: Dict) -> Dict:
    from agents.rescue_agent import RescueAgent
    from models.task import Task
    from services.orchestrator import OrchestratorService
    from sqlalchemy import select
    uid = context.get("user_id")
    session, engine = _sync_session()
    try:
        tasks = [t.to_dict() for t in session.execute(
            select(Task).where(Task.user_id == uid, Task.status == "pending")
        ).scalars().all()]
    finally:
        session.close(); engine.dispose()
    result = RescueAgent(context.get("gemini_service")).detect_risk(tasks, {"daily_available_hours": 4})
    OrchestratorService.add_event("Local Intelligence", "Triggered Rescue Mode", "warning",
                                  {"risk_detected": result.get("risk_detected")}, uid)
    return {"action": "rescue_analysis", "status": "Analysis started",
            "message": "Rescue analysis started."}


def digital_twin_executor(entities: Dict, context: Dict) -> Dict:
    from agents.digital_twin_agent import DigitalTwinAgent
    from models.task import Task
    from services.orchestrator import OrchestratorService
    from sqlalchemy import select
    uid = context.get("user_id")
    session, engine = _sync_session()
    try:
        tasks = [t.to_dict() for t in session.execute(
            select(Task).where(Task.user_id == uid, Task.status == "pending")
        ).scalars().all()]
    finally:
        session.close(); engine.dispose()
    DigitalTwinAgent(context.get("gemini_service")).simulate_scenario(
        tasks, {"action": "shift"}, {"daily_available_hours": 8}
    )
    OrchestratorService.add_event("Local Intelligence", "Triggered Digital Twin", "success", {}, uid)
    return {"action": "simulate", "status": "Simulation complete",
            "message": "Digital Twin simulation complete."}


def planner_agent_executor(entities: Dict, context: Dict) -> Dict:
    from agents.planning_agent import PlanningAgent
    from models.task import Task
    from services.orchestrator import OrchestratorService
    from sqlalchemy import select
    uid = context.get("user_id")
    session, engine = _sync_session()
    try:
        tasks = [t.to_dict() for t in session.execute(
            select(Task).where(Task.user_id == uid, Task.status == "pending")
        ).scalars().all()]
    finally:
        session.close(); engine.dispose()
    PlanningAgent(context.get("gemini_service")).generate_plan(tasks, {"daily_available_hours": 8})
    OrchestratorService.add_event("Local Intelligence", "Generated Schedule", "success",
                                  {"tasks_planned": len(tasks)}, uid)
    return {"action": "generate_schedule", "status": "Schedule generated",
            "message": "Your schedule has been planned."}


def general_query_executor(entities: Dict, context: Dict) -> Dict:
    from services.orchestrator import OrchestratorService
    OrchestratorService.add_event("Local Intelligence", "Processed Query", "success",
                                  {"intent": context.get("intent")}, context.get("user_id"))
    return {"action": "query", "status": "Query processed", "message": "Got it."}


# ── Register ──────────────────────────────────────────────────────────────────
AgentRegistry.register("Navigation",       navigate_executor)
AgentRegistry.register("FocusMode",        focus_mode_executor)
AgentRegistry.register("TaskService",      task_service_executor)
AgentRegistry.register("GoalService",      goal_service_executor)
AgentRegistry.register("RescueAgent",      rescue_agent_executor)
AgentRegistry.register("DigitalTwinAgent", digital_twin_executor)
AgentRegistry.register("PlanningAgent",    planner_agent_executor)
AgentRegistry.register("System",           general_query_executor)
