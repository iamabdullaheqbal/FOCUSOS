"""FocusOS — Goals & Habits Router"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database.db import get_db
from models.goal import Goal, Milestone, Habit, HabitLog
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(tags=["goals"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class GoalCreateIn(BaseModel):
    title: str
    description: str | None = None
    category: str = "General"
    target_date: str | None = None


class GoalUpdateIn(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    target_date: str | None = None
    status: str | None = None
    priority: str | None = None


class HabitCreateIn(BaseModel):
    name: str
    category: str = "General"
    frequency: str = "Daily"


class HabitUpdateIn(BaseModel):
    name: str | None = None
    category: str | None = None
    frequency: str | None = None
    status: str | None = None
    reminder_schedule: str | None = None
    target_duration: str | None = None


class MilestoneStatusIn(BaseModel):
    status: str


class HabitStatusIn(BaseModel):
    status: str


# ── Goals ─────────────────────────────────────────────────────────────────────

@router.get("/goals")
async def get_goals(
    page: int = 1,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Goal)
        .where(Goal.user_id == user_id)
        .options(selectinload(Goal.milestones))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(q)
    goals = result.scalars().all()
    return {"status": "success", "data": [g.to_dict() for g in goals]}


@router.post("/goals", status_code=201)
async def create_goal(
    body: GoalCreateIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not body.title:
        raise HTTPException(status_code=400, detail="Title is required")

    from services.goal_service import GoalService
    ai_service = request.app.state.gemini_service
    try:
        goal = GoalService.create_goal(
            user_id=user_id,
            title=body.title,
            description=body.description or "",
            category=body.category,
            target_date=body.target_date,
            ai_service=ai_service,
        )
        return {"status": "success", "data": goal}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/goals/{goal_id}")
async def edit_goal(
    goal_id: str,
    body: GoalUpdateIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id).options(selectinload(Goal.milestones))
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field in ("title", "description", "category", "target_date", "status", "priority"):
        val = getattr(body, field)
        if val is not None:
            setattr(goal, field, val)

    await db.commit()
    await db.refresh(goal)
    return {"status": "success", "data": goal.to_dict()}


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
    return {"status": "success"}


@router.post("/goals/{goal_id}/archive")
async def archive_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.archived = True
    await db.commit()
    return {"status": "success"}


@router.post("/goals/{goal_id}/unarchive")
async def unarchive_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.archived = False
    await db.commit()
    return {"status": "success"}


@router.post("/goals/{goal_id}/pin")
async def toggle_pin_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.pinned = not goal.pinned
    await db.commit()
    return {"status": "success"}


@router.put("/milestones/{milestone_id}/status")
async def update_milestone_status(
    milestone_id: str,
    body: MilestoneStatusIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id, Milestone.user_id == user_id))
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    milestone.status = body.status
    if body.status == "COMPLETED":
        milestone.completed = True
        milestone.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(milestone)
    return {"status": "success", "data": milestone.to_dict()}


# ── Habits ────────────────────────────────────────────────────────────────────

@router.get("/habits")
async def get_habits(
    page: int = 1,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Habit)
        .where(Habit.user_id == user_id)
        .options(selectinload(Habit.logs))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(q)
    habits = result.scalars().all()
    return {"status": "success", "data": [h.to_dict() for h in habits]}


@router.post("/habits", status_code=201)
async def create_habit(
    body: HabitCreateIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not body.name:
        raise HTTPException(status_code=400, detail="Name is required")
    habit = Habit(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=body.name,
        category=body.category,
        frequency=body.frequency,
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return {"status": "success", "data": habit.to_dict()}


@router.put("/habits/{habit_id}")
async def edit_habit(
    habit_id: str,
    body: HabitUpdateIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id).options(selectinload(Habit.logs))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for field in ("name", "category", "frequency", "status", "reminder_schedule", "target_duration"):
        val = getattr(body, field)
        if val is not None:
            setattr(habit, field, val)
    await db.commit()
    await db.refresh(habit)
    return {"status": "success", "data": habit.to_dict()}


@router.delete("/habits/{habit_id}")
async def delete_habit(
    habit_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.delete(habit)
    await db.commit()
    return {"status": "success"}


@router.post("/habits/{habit_id}/archive")
async def archive_habit(
    habit_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.archived = True
    await db.commit()
    return {"status": "success"}


@router.post("/habits/{habit_id}/unarchive")
async def unarchive_habit(
    habit_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.archived = False
    await db.commit()
    return {"status": "success"}


@router.post("/habits/{habit_id}/status")
async def set_habit_status(
    habit_id: str,
    body: HabitStatusIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id).options(selectinload(Habit.logs))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.status = body.status
    await db.commit()
    await db.refresh(habit)
    return {"status": "success", "data": habit.to_dict()}


@router.post("/habits/{habit_id}/checkin")
async def check_in_habit(
    habit_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id).options(selectinload(Habit.logs))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    habit.current_streak = (habit.current_streak or 0) + 1
    habit.longest_streak = max(habit.longest_streak or 0, habit.current_streak)
    habit.last_checkin_date = today

    log = HabitLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        habit_id=habit_id,
        date=today,
        completed=True,
    )
    db.add(log)
    await db.commit()
    await db.refresh(habit)
    return {"status": "success", "data": habit.to_dict()}
