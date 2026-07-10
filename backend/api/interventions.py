"""FocusOS — Interventions Router"""

import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.db import get_db
from services.intervention_engine import InterventionEngine
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/interventions", tags=["interventions"])


class ExecuteIn(BaseModel):
    strategy_name: str | None = None
    actions: list[dict] = []


class ResolveIn(BaseModel):
    id: str


@router.get("/threats")
async def get_threats(
    page: int = 1,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
):
    return {
        "status": "success",
        "data": InterventionEngine.get_active_threats(user_id=user_id, page=page, limit=limit),
    }


@router.post("/scan")
async def scan(user_id: str = Depends(get_current_user_id)):
    results = InterventionEngine.run_engine(user_id=user_id)
    return {
        "status": "success",
        "message": f"Engine completed sweep. Found {len(results)} active interventions.",
        "data": results,
    }


@router.post("/execute")
async def execute_strategy(
    body: ExecuteIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from models.task import Task
    from services.orchestrator import OrchestratorService

    t0 = time.time()
    for action in body.actions:
        action_type = action.get("action_type")
        target_task_id = action.get("target_task_id")
        if action_type == "calendar_reschedule" and target_task_id:
            result = await db.execute(select(Task).where(Task.id == target_task_id))
            task = result.scalar_one_or_none()
            if task:
                task.deadline = datetime.now(timezone.utc) + timedelta(days=1)
                await db.commit()
                OrchestratorService.add_event(
                    "Intervention Engine",
                    f"Rescheduled task {task.title}",
                    "success",
                    {"task_id": task.id},
                )

    execution_id = f"exec-{int(t0)}"
    return {
        "status": "success",
        "message": f"Strategy {body.strategy_name} executed.",
        "execution_id": execution_id,
    }


@router.post("/undo/{execution_id}")
async def undo_intervention(
    execution_id: str,
    user_id: str = Depends(get_current_user_id),
):
    return {"status": "success", "message": "Strategy undone."}


@router.post("/resolve")
async def resolve_intervention(body: ResolveIn, user_id: str = Depends(get_current_user_id)):
    success = InterventionEngine.resolve_intervention(body.id)
    if success:
        return {"status": "success", "message": "Intervention resolved."}
    raise HTTPException(status_code=404, detail="Intervention not found.")


@router.post("/{intervention_id}/simulate")
async def simulate_intervention(
    intervention_id: str,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Simulate the outcome of applying an intervention strategy using the Digital Twin."""
    from fastapi import Request as _Req
    from sqlalchemy import select
    from models.intervention import Intervention
    from models.task import Task
    from models.telemetry import TwinSimulationLog
    from services.availability_service import AvailabilityService
    from agents.digital_twin_agent import DigitalTwinAgent

    # Fetch the intervention
    result = await db.execute(select(Intervention).where(Intervention.id == intervention_id))
    intervention = result.scalar_one_or_none()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")

    action_type = intervention.recommended_action.get("action_type", "")
    scenario_map = {
        "calendar_reschedule": "DELAY_TASK",
        "focus_block_injection": "INCREASE_WORKLOAD",
        "invoke_planning_agent": "EXECUTE_INTERVENTION",
        "coach_challenge": "EXECUTE_INTERVENTION",
    }
    scenario = {
        "action": scenario_map.get(action_type, "EXECUTE_INTERVENTION"),
        "task": intervention.recommended_action.get("target_task", "General Action"),
        "delay_days": 1,
    }

    tasks_result = await db.execute(select(Task).where(Task.user_id == user_id, Task.status != "done"))
    tasks = [t.to_dict() for t in tasks_result.scalars().all()]
    availability = AvailabilityService.get_current_availability()

    twin_result = DigitalTwinAgent(ai_service).simulate_scenario(tasks, scenario, availability)

    current_risk = twin_result.get("current_state", {}).get("risk_score", 50)
    projected_risk = twin_result.get("projected_state", {}).get("risk_score", 50)
    if isinstance(projected_risk, str):
        projected_risk = 50
    twin_result["risk_reduction"] = max(0, current_risk - projected_risk)
    twin_result["capacity_gain"] = (
        twin_result.get("capacity_impact", 0) * -1 if action_type == "calendar_reschedule" else 2
    )

    # Persist simulation log
    log = TwinSimulationLog(
        user_id=user_id,
        scenario_type=scenario["action"],
        current_success_probability=twin_result.get("current_state", {}).get("success_probability"),
        projected_success_probability=twin_result.get("projected_state", {}).get("success_probability"),
        current_risk_score=current_risk,
        projected_risk_score=projected_risk,
        capacity_impact=twin_result.get("capacity_impact"),
        schedule_stability=twin_result.get("schedule_stability"),
        scenario_payload=scenario,
        simulation_result=twin_result,
    )
    db.add(log)
    await db.commit()

    return {"status": "success", "data": twin_result}
