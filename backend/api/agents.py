"""FocusOS — Agents Router"""

import json
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database.db import get_db
from models.task import Task
from models.schedule import Schedule, ScheduleSlot
from models.intervention import RescuePlan, RescueExecution
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

# ── In-memory agent state tracker ────────────────────────────────────────────
_agent_status: dict = {
    k: {"state": "idle", "last_run": None}
    for k in ["priority", "planning", "rescue", "accountability", "coach", "twin", "vision", "reflection", "intervention"]
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _set(agent: str, state: str):
    _agent_status.setdefault(agent, {"state": "idle", "last_run": None})
    _agent_status[agent]["state"] = state
    if state == "done":
        _agent_status[agent]["last_run"] = _now_iso()


# ── Schemas ───────────────────────────────────────────────────────────────────

class PrioritizeIn(BaseModel):
    title: str | None = None
    deadline: str | None = None
    description: str | None = None
    estimated_hours: float | None = None
    task_ids: list[str] = []


class PlanIn(BaseModel):
    tasks: list[dict] = []
    availability: dict = {}


class RescueIn(BaseModel):
    tasks: list[dict] = []
    availability: dict = {}


class TwinIn(BaseModel):
    scenario: dict = {}


class AccountabilityIn(BaseModel):
    active_tasks: list[dict] = []
    completed_tasks: list[dict] = []
    overdue_tasks: list[dict] = []


class CoachIn(BaseModel):
    active_tasks: list[dict] = []
    metrics: dict = {}


class ReflectionIn(BaseModel):
    tasks: list[dict] = []
    twin_simulation: dict = {}


class RescueExecuteIn(BaseModel):
    plan_id: str | None = None
    action: str | None = None


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/status")
async def agent_status():
    from services.orchestrator import OrchestratorService
    registered = ["vision", "priority", "planning", "accountability", "coach",
                  "rescue", "twin", "reflection", "goal", "document", "voice", "intervention"]
    feed = OrchestratorService.get_feed()
    recently_active: set[str] = set()
    for ev in feed[:50]:
        name = ev.get("agent", "").lower()
        for ra in registered:
            if ra in name:
                recently_active.add(ra)
                break

    running = [k for k, v in _agent_status.items() if v["state"] == "running"]
    active = len(set(running) | recently_active) or 1

    return {"status": "success", "data": {
        "online_agents": len(registered),
        "active_agents": active,
        "recently_active": list(recently_active),
        "states": _agent_status,
    }}


# ── Priority Agent ────────────────────────────────────────────────────────────

@router.post("/prioritize")
async def run_priority_agent(
    body: PrioritizeIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from agents.priority_agent import PriorityAgent
    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")

    pa = PriorityAgent(ai_service)
    count_result = await db.execute(
        select(Task).where(Task.user_id == user_id, Task.status != "done")
    )
    active_count = len(count_result.scalars().all())

    # Single task ad-hoc
    if body.title and body.deadline:
        try:
            _set("priority", "running")
            result = pa.analyze_task(body.model_dump(), active_count)
            _set("priority", "done")
            return result
        except Exception as e:
            _set("priority", "error")
            raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")

    # Batch
    if body.task_ids:
        q = select(Task).where(Task.user_id == user_id, Task.id.in_(body.task_ids))
    else:
        q = select(Task).where(Task.user_id == user_id, Task.status != "done")

    result = await db.execute(q)
    tasks = result.scalars().all()

    _set("priority", "running")
    results = []
    for task in tasks:
        td = {"title": task.title, "description": task.description or "",
              "deadline": task.deadline.isoformat(), "estimated_hours": task.estimated_hours or 1.0}
        try:
            analysis = pa.analyze_task(td, active_count)
            results.append({"task_id": task.id, "analysis": analysis})
        except Exception as e:
            results.append({"task_id": task.id, "error": str(e)})
    _set("priority", "done")

    return {"agent": "priority", "status": "success", "results": results, "timestamp": _now_iso()}


# ── Planning Agent ────────────────────────────────────────────────────────────

@router.get("/plan/latest")
async def get_latest_plan(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule)
        .where(Schedule.user_id == user_id)
        .options(selectinload(Schedule.slots))
        .order_by(Schedule.created_at.desc())
        .limit(1)
    )
    schedule = result.scalar_one_or_none()
    return {"status": "success", "data": schedule.to_dict() if schedule else None}


@router.post("/plan")
async def run_planning_agent(
    body: PlanIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from agents.planning_agent import PlanningAgent
    from services.telemetry_service import TelemetryService
    from services.intervention_engine import InterventionEngine

    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")

    availability = body.availability or {
        "daily_available_hours": 8,
        "preferred_work_hours": {"start": "09:00", "end": "17:00"},
    }

    try:
        t0 = time.time()
        _set("planning", "running")
        result = PlanningAgent(ai_service).generate_plan(body.tasks, availability)

        target_date = (
            result.get("schedule", [{}])[0].get("date", datetime.now().strftime("%Y-%m-%d"))
            if result.get("schedule") else datetime.now().strftime("%Y-%m-%d")
        )
        new_schedule = Schedule(
            user_id=user_id,
            target_date=target_date,
            confidence_score=result.get("confidence_score", 100),
            sys_confidence=result.get("_system_confidence", 100),
            daily_summary=result.get("daily_summary", ""),
            strategy=availability.get("strategy", "Balanced"),
            available_hours=availability.get("daily_available_hours", 8),
            generated_by=result.get("_inference_source", "local"),
            planning_brief=json.dumps(result.get("planning_brief", [])),
            twin_simulation=json.dumps(result.get("twin_simulation")),
            backlog=json.dumps(result.get("backlog", [])),
        )
        for slot_data in result.get("schedule", []):
            slot = ScheduleSlot(
                user_id=user_id,
                task_id=slot_data.get("task_id"),
                task_title=slot_data.get("task", "Untitled"),
                start_time=slot_data.get("start_time", "00:00"),
                end_time=slot_data.get("end_time", "00:00"),
                focus_block=slot_data.get("focus_block", False),
                is_break="break" in slot_data.get("task", "").lower(),
            )
            new_schedule.slots.append(slot)

        db.add(new_schedule)
        await db.commit()

        # Re-fetch with slots
        await db.refresh(new_schedule)
        result = await db.execute(
            select(Schedule).where(Schedule.id == new_schedule.id).options(selectinload(Schedule.slots))
        )
        new_schedule = result.scalar_one()

        TelemetryService.log_execution("Planning Agent", "Generate Plan", "success", t0, 85)
        _set("planning", "done")
        InterventionEngine.trigger_evaluation()

        return {"agent": "planning", "status": "success", "data": new_schedule.to_dict(), "timestamp": _now_iso()}
    except Exception as e:
        _set("planning", "error")
        logger.error("Planning Agent error: %s", e)
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")


# ── Rescue Agent ──────────────────────────────────────────────────────────────

@router.post("/rescue")
async def run_rescue_agent(
    body: RescueIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from agents.rescue_agent import RescueAgent
    from services.telemetry_service import TelemetryService

    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")

    availability = body.availability or {"daily_available_hours": 3}
    try:
        t0 = time.time()
        _set("rescue", "running")
        result = RescueAgent(ai_service).generate_recovery_plan(body.tasks, availability)
        TelemetryService.log_execution("Rescue Agent", "Recovery Plan", "success", t0, 92)
        _set("rescue", "done")

        plan = RescuePlan(user_id=user_id, success_rate=result.get("success_probability"), intervention=result.get("recovery_plan", []))
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
        result["plan_id"] = plan.id

        return {"agent": "rescue", "status": "success", "data": result, "timestamp": _now_iso()}
    except Exception as e:
        _set("rescue", "error")
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")


@router.post("/rescue/execute")
async def execute_rescue_plan(
    body: RescueExecuteIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    execution = RescueExecution(
        user_id=user_id,
        plan_id=body.plan_id,
        user_response="ACCEPTED",
        outcome=f"Executed {body.action}",
    )
    db.add(execution)
    await db.commit()
    return {"status": "success"}


@router.get("/rescue/history")
async def get_rescue_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RescuePlan).where(RescuePlan.user_id == user_id).order_by(RescuePlan.timestamp.desc()).limit(10)
    )
    plans = result.scalars().all()
    return {"status": "success", "data": [p.to_dict() for p in plans]}


# ── Digital Twin Agent ────────────────────────────────────────────────────────

@router.post("/digital-twin")
async def run_digital_twin(
    body: TwinIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from agents.digital_twin_agent import DigitalTwinAgent
    from services.availability_service import AvailabilityService
    from services.telemetry_service import TelemetryService

    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    if not body.scenario:
        raise HTTPException(status_code=400, detail="No scenario provided")

    tasks_result = await db.execute(select(Task).where(Task.user_id == user_id, Task.status != "done"))
    tasks = [t.to_dict() for t in tasks_result.scalars().all()]
    availability = AvailabilityService.get_current_availability()

    try:
        t0 = time.time()
        _set("twin", "running")
        result = DigitalTwinAgent(ai_service).simulate_scenario(tasks, body.scenario, availability)
        TelemetryService.log_execution("Digital Twin Agent", "Simulation", "success", t0, 90, user_id=user_id)
        _set("twin", "done")

        # Persist simulation log
        from models.telemetry import TwinSimulationLog
        current_risk = result.get("current_state", {}).get("risk_score")
        projected_risk = result.get("projected_state", {}).get("risk_score")
        if isinstance(projected_risk, str):
            projected_risk = None
        log = TwinSimulationLog(
            user_id=user_id,
            scenario_type=body.scenario.get("action", "CUSTOM"),
            current_success_probability=result.get("current_state", {}).get("success_probability"),
            projected_success_probability=result.get("projected_state", {}).get("success_probability"),
            current_risk_score=current_risk,
            projected_risk_score=projected_risk,
            capacity_impact=result.get("capacity_impact"),
            schedule_stability=result.get("schedule_stability"),
            scenario_payload=body.scenario,
            simulation_result=result,
        )
        db.add(log)
        await db.commit()

        return {"agent": "twin", "status": "success", "data": result, "timestamp": _now_iso()}
    except Exception as e:
        _set("twin", "error")
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")


@router.get("/twin/history")
async def get_twin_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        from models.telemetry import TwinSimulationLog
        result = await db.execute(
            select(TwinSimulationLog).where(TwinSimulationLog.user_id == user_id)
            .order_by(TwinSimulationLog.created_at.desc()).limit(10)
        )
        logs = result.scalars().all()
        return {"status": "success", "data": [l.to_dict() for l in logs]}
    except Exception:
        return {"status": "success", "data": []}


# ── Vision Agent ──────────────────────────────────────────────────────────────

@router.post("/vision")
async def run_vision_agent(
    request: Request,
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from agents.vision_agent import VisionAgent
    from services.telemetry_service import TelemetryService

    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    if image.content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {image.content_type}")

    try:
        t0 = time.time()
        raw_bytes = await image.read()
        agent = VisionAgent(ai_service)
        _set("vision", "running")

        image_bytes = agent.preprocess_image(raw_bytes)
        ocr_result, ocr_conf = agent.extract_tasks_via_ocr(image_bytes)
        raw_text = ocr_result.get("raw_text", "")

        from services.local_intelligence.execution_engine import ExecutionEngine
        if ocr_conf < 0.2 and not raw_text.strip():
            mistral_res = agent.extract_tasks_from_image(raw_bytes, image.content_type)
            raw_text = mistral_res.get("summary", "")

        execution = ExecutionEngine.execute(
            source="vision", transcript=raw_text, ai_service=ai_service, user_id=user_id
        )
        TelemetryService.log_execution("Vision Agent", "OCR & Execution", "success", t0, int(ocr_conf * 100))
        _set("vision", "done")

        return {
            "agent": "vision", "status": execution.get("status", "success"),
            "raw_text": raw_text, "confidence": execution.get("confidence", 0),
            "summary": execution.get("message", ""),
            "tasks": execution.get("entities", {}).get("tasks", []),
            "action_items": execution.get("entities", {}).get("action_items", []),
            "inserted_task_ids": execution.get("data", {}).get("inserted_ids", []),
            "structured_result": execution, "timestamp": _now_iso(),
        }
    except Exception as e:
        logger.error("Vision Agent failed: %s", e, exc_info=True)
        _set("vision", "idle")
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")


@router.post("/vision/confirm")
async def confirm_vision(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    from datetime import timedelta
    from services.orchestrator import OrchestratorService
    from services.telemetry_service import TelemetryService

    data = await request.json()
    confirmed_tasks = data.get("confirmed_tasks", [])

    try:
        t0 = time.time()
        _set("vision", "running")
        titles = [t.get("title", "") for t in confirmed_tasks]
        existing_result = await db.execute(select(Task).where(Task.user_id == user_id, Task.title.in_(titles)))
        existing_titles = {t.title for t in existing_result.scalars().all()}

        inserted = []
        for td in confirmed_tasks:
            title = td.get("title", "Vision Extracted Task")
            if title in existing_titles:
                continue
            try:
                dl = datetime.fromisoformat(td["deadline"]) if td.get("deadline") and td["deadline"] != "None" else datetime.now(timezone.utc) + timedelta(days=1)
            except Exception:
                dl = datetime.now(timezone.utc) + timedelta(days=1)

            task = Task(
                id=str(_uuid.uuid4()), user_id=user_id, title=title,
                deadline=dl, description=f"Priority: {td.get('priority', 'Medium')} (Vision Confirmed)",
                source="vision", status="pending", ai_confidence=100,
            )
            inserted.append(task)

        if inserted:
            db.add_all(inserted)
        await db.commit()

        TelemetryService.log_execution("Vision Agent", "User Confirmation", "success", t0, 100)
        OrchestratorService.add_event("Vision Agent", "User confirmed and saved tasks", "success", {"count": len(inserted)})
        _set("vision", "done")
        return {"success": True, "inserted_task_ids": [t.id for t in inserted]}
    except Exception as e:
        logger.error("Vision confirm failed: %s", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save: {e}")


# ── Accountability Agent ──────────────────────────────────────────────────────

@router.post("/accountability")
async def run_accountability(
    body: AccountabilityIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    from agents.accountability_agent import AccountabilityAgent
    from services.telemetry_service import TelemetryService
    ai_service = request.app.state.ai_service
    _set("accountability", "running")
    try:
        t0 = time.time()
        result = AccountabilityAgent(ai_service).generate_metrics(body.active_tasks, body.completed_tasks, body.overdue_tasks)
        TelemetryService.log_execution("Accountability Agent", "Generate Metrics", "success", t0, 80)
        return {"agent": "accountability", "status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")
    finally:
        _set("accountability", "idle")


# ── Coach Agent ───────────────────────────────────────────────────────────────

@router.post("/coach")
async def run_coach(
    body: CoachIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    from agents.coach_agent import CoachAgent
    from services.telemetry_service import TelemetryService
    ai_service = request.app.state.ai_service
    _set("coach", "running")
    try:
        t0 = time.time()
        result = CoachAgent(ai_service).generate_coaching(body.active_tasks, body.metrics)
        TelemetryService.log_execution("Coach Agent", "Generate Coaching", "success", t0, 88)
        return {"agent": "coach", "status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")
    finally:
        _set("coach", "idle")


# ── Reflection Agent ──────────────────────────────────────────────────────────

@router.post("/reflection")
async def run_reflection(
    body: ReflectionIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    from agents.reflection_agent import ReflectionAgent
    from services.telemetry_service import TelemetryService
    ai_service = request.app.state.ai_service
    _set("reflection", "running")
    try:
        t0 = time.time()
        result = ReflectionAgent(ai_service).generate_reflection(body.tasks, body.twin_simulation)
        TelemetryService.log_execution("Reflection Agent", "Generate Reflection", "success", t0, 85)
        return {"agent": "reflection", "status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")
    finally:
        _set("reflection", "idle")
