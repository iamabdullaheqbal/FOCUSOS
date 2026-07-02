"""FocusOS — Health Router"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from sqlalchemy import text
from database.db import AsyncSessionLocal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health(request: Request):
    return {
        "status": "healthy",
        "service": "FocusOS",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/db")
async def health_db():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Database reachable"}
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content={"status": "error", "message": str(exc)})


@router.get("/gemini")
async def health_gemini(request: Request):
    gemini = request.app.state.gemini_service
    if not gemini:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content={"status": "error", "message": "GeminiService not initialised"})
    result = gemini.health_check()
    status = 200 if result.get("status") == "ok" else 503
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=status, content=result)
