"""FocusOS — Settings Router"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.db import get_db
from models.user import User
from models.user_settings import UserSettings
from models.user_session import UserSession
from models.task import Task
from models.goal import Goal
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])

VALID_SECTIONS = {"appearance", "notifications", "planner", "ai", "security"}


async def _get_or_create_settings(user_id: str, db: AsyncSession) -> UserSettings:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "data": user.serialize()}


class ProfileUpdateIn(BaseModel):
    full_name: str | None = None
    username: str | None = None
    email: str | None = None
    timezone: str | None = None
    country: str | None = None
    avatar_url: str | None = None


@router.put("/profile")
async def update_profile(
    body: ProfileUpdateIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field in ("full_name", "username", "email", "timezone", "country", "avatar_url"):
        val = getattr(body, field)
        if val is not None:
            setattr(user, field, val)

    await db.commit()
    await db.refresh(user)
    return {"status": "success", "data": user.serialize()}


# ── Section settings ──────────────────────────────────────────────────────────

@router.get("/{section}")
async def get_settings_section(
    section: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if section not in VALID_SECTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid section. Valid: {', '.join(VALID_SECTIONS)}")
    settings = await _get_or_create_settings(user_id, db)
    return {"status": "success", "data": getattr(settings, section) or {}}


@router.put("/{section}")
async def update_settings_section(
    section: str,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if section not in VALID_SECTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid section. Valid: {', '.join(VALID_SECTIONS)}")
    data = await request.json()
    settings = await _get_or_create_settings(user_id, db)
    current = getattr(settings, section) or {}
    merged = {**current, **data}
    setattr(settings, section, merged)
    await db.commit()
    return {"status": "success", "data": merged}


# ── Sessions ──────────────────────────────────────────────────────────────────

@router.get("/sessions")
async def get_sessions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == user_id)
        .order_by(UserSession.last_active.desc())
    )
    sessions = result.scalars().all()
    data = [s.serialize() for s in sessions]
    if data:
        data[0]["is_current"] = True
    return {"status": "success", "data": data}


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSession).where(UserSession.id == session_id, UserSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
    return {"status": "success", "data": {"message": "Session revoked"}}


# ── Connected accounts ────────────────────────────────────────────────────────

@router.get("/accounts")
async def get_accounts(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": [
        {"provider": "google", "connected": False},
        {"provider": "github", "connected": False},
        {"provider": "microsoft", "connected": False},
    ]}


@router.put("/accounts")
async def update_accounts(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": {"message": "OAuth updates require redirect"}}


# ── Data export ───────────────────────────────────────────────────────────────

@router.post("/export")
async def export_data(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    settings_result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = settings_result.scalar_one_or_none()

    tasks_result = await db.execute(select(Task).where(Task.user_id == user_id))
    tasks = tasks_result.scalars().all()

    goals_result = await db.execute(select(Goal).where(Goal.user_id == user_id))
    goals = goals_result.scalars().all()

    return {
        "status": "success",
        "message": "Data exported successfully",
        "data": {
            "profile": user.serialize() if user else {},
            "settings": settings.serialize() if settings else {},
            "tasks": [t.to_dict() for t in tasks],
            "goals": [g.to_dict() for g in goals],
        },
    }
