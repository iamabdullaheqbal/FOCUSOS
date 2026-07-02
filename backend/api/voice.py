"""FocusOS — Voice Copilot Router"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from services.voice_service import VoiceService
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice"])


class VoiceIn(BaseModel):
    transcript: str


@router.post("/process")
async def process_voice(
    body: VoiceIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    if not body.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")
    ai_service = request.app.state.gemini_service
    result = VoiceService.process_voice_command(body.transcript, ai_service)
    return {"status": "success", "data": result}
