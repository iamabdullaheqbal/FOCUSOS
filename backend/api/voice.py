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
    timezone: str = "UTC"   # IANA timezone sent by the browser (e.g. "Asia/Karachi")


@router.post("/process")
async def process_voice(
    body: VoiceIn,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    if not body.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")
    ai_service = request.app.state.ai_service
    result = VoiceService.process_voice_command(
        body.transcript, ai_service, user_id=user_id, timezone=body.timezone
    )

    # Emit a sync event so the frontend Calendar refreshes automatically
    # when a meeting was successfully scheduled via voice
    if result.get("execution", {}).get("action") == "create_meeting":
        try:
            from services.orchestrator import OrchestratorService
            OrchestratorService.add_event(
                "Voice Copilot",
                "calendar_updated",
                "success",
                {"user_id": user_id},
                user_id,
            )
        except Exception:
            pass

    return {"status": "success", "data": result}
