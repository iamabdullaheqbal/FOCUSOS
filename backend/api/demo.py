"""FocusOS — Demo Router"""

import os
import uuid
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select
from database.db import AsyncSessionLocal
from models.user import User

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_USER_ID    = "00000000-0000-0000-0000-000000deadbeef"
DEMO_USER_EMAIL = "demo@focusos.local"
DEMO_USERNAME   = "demo_user"
DEMO_FULL_NAME  = "Demo User"


def _secret() -> str:
    s = os.environ.get("APP_SECRET_KEY") or os.environ.get("FLASK_SECRET_KEY")
    if not s:
        raise HTTPException(status_code=500, detail="Server auth key not configured")
    return s


def _make_token(extra: dict = {}) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": DEMO_USER_ID, "email": DEMO_USER_EMAIL,
        "username": DEMO_USERNAME, "full_name": DEMO_FULL_NAME,
        "is_demo": True, "iat": now.timestamp(),
        "exp": now + timedelta(hours=24),
        **extra,
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


@router.post("/simulate-twin/{user_id}")
async def simulate_twin(user_id: str, request: Request):
    """
    Run a quick Digital Twin simulation for a given user using their live DB tasks.
    Called by the frontend via FocusOSApi.runDigitalTwinSimulation(userId).
    """
    from sqlalchemy import select
    from models.task import Task
    from services.availability_service import AvailabilityService
    from agents.digital_twin_agent import DigitalTwinAgent

    ai_service = request.app.state.ai_service
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Task).where(Task.user_id == user_id, Task.status != "done")
        )
        tasks = [t.to_dict() for t in result.scalars().all()]

    if not tasks:
        return {"status": "success", "message": "No active tasks to simulate.", "data": {}}

    availability = AvailabilityService.get_current_availability()
    # Default worst-case scenario: delay the first task by 1 day
    scenario = {
        "action": "delay_task",
        "task": tasks[0].get("title", "Task"),
        "delay_days": 1,
    }

    try:
        result = DigitalTwinAgent(ai_service).simulate_scenario(tasks, scenario, availability)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Simulation failed: {e}")


@router.post("/start")
async def start_demo():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                id=DEMO_USER_ID, email=DEMO_USER_EMAIL,
                username=DEMO_USERNAME, full_name=DEMO_FULL_NAME,
            )
            db.add(user)
            try:
                await db.commit()
            except Exception:
                await db.rollback()

    access  = _make_token()
    refresh = _make_token({"exp": datetime.now(timezone.utc) + timedelta(days=30)})
    return {
        "access_token": access, "refresh_token": refresh,
        "user": {"id": DEMO_USER_ID, "email": DEMO_USER_EMAIL, "username": DEMO_USERNAME},
    }
