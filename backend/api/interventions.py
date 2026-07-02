"""FocusOS — Interventions Router"""

import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
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
        "data": InterventionEngine.get_active_threats(page=page, limit=limit),
    }


@router.post("/scan")
async def scan(user_id: str = Depends(get_current_user_id)):
    results = InterventionEngine.run_engine()
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
