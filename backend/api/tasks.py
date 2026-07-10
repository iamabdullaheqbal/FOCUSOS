"""FocusOS — Tasks Router"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database.db import get_db
from models.task import Task
from utils.auth import get_current_user_id
from services.intervention_engine import InterventionEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tasks", tags=["tasks"])

VALID_STATUSES = {"pending", "in_progress", "done", "overdue"}
VALID_CATEGORIES = {"work", "personal", "study", "other"}
VALID_SOURCES = {"manual", "vision", "voice"}


class TaskCreateIn(BaseModel):
    title: str
    description: str | None = None
    deadline: str  # ISO 8601
    estimated_hours: float = 1.0
    category: str = "work"
    source: str = "manual"
    source_file: str | None = None


class TaskUpdateIn(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: str | None = None
    estimated_hours: float | None = None
    actual_hours: float | None = None
    category: str | None = None
    status: str | None = None


class ProgressIn(BaseModel):
    hours_logged: float
    status: str | None = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def list_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    sort: str = "deadline",
    order: str = "asc",
    page: int = 1,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    q = select(Task).where(Task.user_id == user_id)
    if status and status in VALID_STATUSES:
        q = q.where(Task.status == status)
    if category and category in VALID_CATEGORIES:
        q = q.where(Task.category == category)

    sort_col = getattr(Task, sort, Task.deadline)
    q = q.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar()

    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    tasks = result.scalars().all()

    return {"tasks": [t.to_dict() for t in tasks], "count": len(tasks), "total": total, "page": page, "limit": limit}


@router.post("", status_code=201)
async def create_task(
    body: TaskCreateIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="Title is required")
    try:
        deadline = datetime.fromisoformat(body.deadline.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid deadline format (use ISO 8601)")

    task = Task(
        id=str(uuid.uuid4()),
        title=body.title.strip(),
        description=body.description,
        deadline=deadline,
        estimated_hours=body.estimated_hours,
        category=body.category if body.category in VALID_CATEGORIES else "work",
        status="pending",
        source=body.source if body.source in VALID_SOURCES else "manual",
        source_file=body.source_file,
        user_id=user_id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    InterventionEngine.trigger_evaluation(user_id)
    return {"task": task.to_dict(), "message": "Task created successfully"}


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task": task.to_dict()}


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    body: TaskUpdateIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.estimated_hours is not None:
        task.estimated_hours = body.estimated_hours
    if body.actual_hours is not None:
        task.actual_hours = body.actual_hours
    if body.category is not None:
        if body.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=422, detail=f"Invalid category '{body.category}'")
        task.category = body.category
    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"Invalid status '{body.status}'")
        task.status = body.status
    if body.deadline is not None:
        try:
            task.deadline = datetime.fromisoformat(body.deadline.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid deadline format")

    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    InterventionEngine.trigger_evaluation(user_id)
    return {"task": task.to_dict(), "message": "Task updated"}


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    InterventionEngine.trigger_evaluation(user_id)
    return {"message": "Task deleted", "id": task_id}


@router.post("/{task_id}/progress")
async def log_progress(
    task_id: str,
    body: ProgressIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if body.hours_logged < 0:
        raise HTTPException(status_code=422, detail="hours_logged must be non-negative")

    task.actual_hours = round((task.actual_hours or 0) + body.hours_logged, 2)
    if body.status and body.status in VALID_STATUSES:
        task.status = body.status
    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    InterventionEngine.trigger_evaluation(user_id)
    return {"task": task.to_dict(), "completion_percentage": task.completion_percentage, "message": "Progress logged"}
