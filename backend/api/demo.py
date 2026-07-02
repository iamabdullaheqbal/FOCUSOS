"""FocusOS — Demo Router"""

import os
import uuid
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
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
