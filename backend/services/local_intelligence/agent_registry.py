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
        ai_service=context.get("ai_service"),
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
    result = RescueAgent(context.get("ai_service")).detect_risk(tasks, {"daily_available_hours": 4})
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
    DigitalTwinAgent(context.get("ai_service")).simulate_scenario(
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
    PlanningAgent(context.get("ai_service")).generate_plan(tasks, {"daily_available_hours": 8})
    OrchestratorService.add_event("Local Intelligence", "Generated Schedule", "success",
                                  {"tasks_planned": len(tasks)}, uid)
    return {"action": "generate_schedule", "status": "Schedule generated",
            "message": "Your schedule has been planned."}


def meeting_scheduler_executor(entities: Dict, context: Dict) -> Dict:
    """Creates a CalendarEvent from a voice-scheduled meeting."""
    from models.calendar_event import CalendarEvent
    from services.orchestrator import OrchestratorService
    from datetime import datetime, timezone, timedelta
    import re

    uid = context.get("user_id")          # ← comes from execution_engine context dict
    original_text = entities.get("_original_transcript", "")

    # ── Extract attendee from "with <name>" ──────────────────────────────────
    attendee = entities.get("attendee", "")
    if not attendee:
        with_match = re.search(
            r'\bwith\s+([a-zA-Z][a-zA-Z\s\.]+?)(?:\s+on|\s+at|\s+for|\s+\d|$)',
            original_text, re.IGNORECASE
        )
        if with_match:
            attendee = with_match.group(1).strip()

    meeting_title = f"Meeting with {attendee}" if attendee else (entities.get("target_name") or "Scheduled Meeting")

    # ── Parse start time ──────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    start_dt = None

    target_date = entities.get("target_date")
    if target_date:
        try:
            start_dt = datetime.fromisoformat(target_date)
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
        except Exception:
            pass

    # If dateparser gave midnight (00:00), try to extract explicit time from transcript
    if start_dt and start_dt.hour == 0 and start_dt.minute == 0:
        time_match = re.search(
            r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b', original_text, re.IGNORECASE
        )
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            meridiem = time_match.group(3).lower()
            if meridiem == "pm" and hour != 12:
                hour += 12
            elif meridiem == "am" and hour == 12:
                hour = 0
            start_dt = start_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)

    # If date is wildly in the future (> 2 years), it's a parse error — use today
    if start_dt and (start_dt - now).days > 730:
        start_dt = None

    if not start_dt:
        # Extract time from transcript with regex as fallback
        time_match = re.search(
            r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b', original_text, re.IGNORECASE
        )
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            meridiem = time_match.group(3).lower()
            if meridiem == "pm" and hour != 12:
                hour += 12
            elif meridiem == "am" and hour == 12:
                hour = 0
            start_dt = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            # If the time already passed today, schedule for tomorrow
            if start_dt < now:
                start_dt += timedelta(days=1)
        else:
            # Default: today at 10:00 AM
            start_dt = now.replace(hour=10, minute=0, second=0, microsecond=0)
            if start_dt < now:
                start_dt += timedelta(days=1)

    # ── Duration ──────────────────────────────────────────────────────────────
    duration_str = entities.get("duration", "")
    duration_hours = 1.0
    if duration_str:
        dur_match = re.search(r'(\d+)\s*(hour|minute)', duration_str)
        if dur_match:
            val = int(dur_match.group(1))
            unit = dur_match.group(2)
            duration_hours = val if unit == "hour" else val / 60.0

    end_dt = start_dt + timedelta(hours=duration_hours)

    session, engine = _sync_session()
    try:
        event = CalendarEvent(
            user_id=uid,
            title=meeting_title,
            attendees=attendee or None,
            start_time=start_dt,
            end_time=end_dt,
            event_type="meeting",
            source="voice",
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        OrchestratorService.add_event(
            "Meeting Scheduler", f"Scheduled '{meeting_title}'", "success",
            {"event_id": event.id, "start": start_dt.isoformat()}, uid
        )
        return {
            "action": "create_meeting",
            "status": "Meeting scheduled",
            "message": f"Meeting '{meeting_title}' scheduled for {start_dt.strftime('%B %d at %I:%M %p')}.",
            "data": event.to_dict(),
        }
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("meeting_scheduler_executor failed: %s", e)
        return {"action": "error", "status": "Failed", "message": f"Could not schedule meeting: {e}"}
    finally:
        session.close(); engine.dispose()


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
AgentRegistry.register("MeetingScheduler", meeting_scheduler_executor)
AgentRegistry.register("System",           general_query_executor)
