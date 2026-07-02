"""FocusOS — Orchestration Router"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from services.orchestrator import OrchestratorService
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orchestration", tags=["orchestration"])

ALLOWED_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@router.get("/feed")
async def get_feed(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "feed": OrchestratorService.get_feed()}


@router.post("/pipeline")
async def run_pipeline(
    request: Request,
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    gemini = request.app.state.gemini_service
    if not gemini:
        raise HTTPException(status_code=503, detail="GeminiService not available")
    if image.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {image.content_type}")

    image_bytes = await image.read()
    try:
        orchestrator = OrchestratorService(gemini)
        availability = {"daily_available_hours": 6, "preferred_work_hours": {"start": "09:00", "end": "21:00"}}
        result = orchestrator.run_pipeline(image_bytes, image.content_type, availability)
        return result
    except Exception as e:
        logger.error("Pipeline failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_system(
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    gemini = request.app.state.gemini_service
    if not gemini:
        raise HTTPException(status_code=503, detail="GeminiService not available")
    try:
        orchestrator = OrchestratorService(gemini)
        result = orchestrator.evaluate_system_state(user_id)
        return result
    except Exception as e:
        logger.error("System orchestration failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
