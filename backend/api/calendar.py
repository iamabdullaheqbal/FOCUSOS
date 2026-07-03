"""FocusOS — Calendar Router"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from services.calendar_service import CalendarService
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calendar", tags=["calendar"])


class RescheduleIn(BaseModel):
    id: str
    start: str
    end: str


@router.get("/events")
async def get_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
):
    return {"status": "success", "data": CalendarService.get_events(start_date=start, end_date=end, user_id=user_id)}


@router.get("/intelligence")
async def get_intelligence(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": CalendarService.get_intelligence(user_id=user_id)}


@router.post("/reschedule")
async def reschedule(body: RescheduleIn, user_id: str = Depends(get_current_user_id)):
    success = CalendarService.reschedule_event(event_id=body.id, new_start=body.start, new_end=body.end, user_id=user_id)
    if success:
        return {"status": "success"}
    from fastapi import HTTPException
    raise HTTPException(status_code=400, detail="Reschedule failed")
