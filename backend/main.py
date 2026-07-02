"""
FocusOS — FastAPI Application Entry Point
==========================================
Run with:
    uvicorn main:app --reload --port 8000

Or directly:
    python main.py
"""

import logging
import sys
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings

# ── Logging ───────────────────────────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["1000/hour"])


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("[START] FocusOS backend starting…")

    # Validate required env vars
    missing = [v for v in ("DATABASE_URL", "MISTRAL_API_KEY") if not os.getenv(v)]
    if missing:
        logger.warning("[ENV] Missing env vars (non-fatal): %s", ", ".join(missing))

    # Create DB tables
    from database.init_db import init_db
    await init_db()
    logger.info("[DB] Tables ready.")

    # Initialise Mistral AI service
    if settings.MISTRAL_API_KEY:
        from services.mistral_service import MistralService
        app.state.gemini_service = MistralService(
            api_key=settings.MISTRAL_API_KEY,
            model=settings.MISTRAL_MODEL,
            vision_model=settings.MISTRAL_VISION_MODEL,
            max_retries=settings.MISTRAL_MAX_RETRIES,
            retry_delay=settings.MISTRAL_RETRY_DELAY,
            cache_ttl=settings.MISTRAL_CACHE_TTL,
            cache_maxsize=settings.MISTRAL_CACHE_MAXSIZE,
        )
        logger.info("[MISTRAL] MistralService ready | model=%s", settings.MISTRAL_MODEL)
    else:
        app.state.gemini_service = None
        logger.warning("[MISTRAL] MISTRAL_API_KEY not set — AI features disabled.")

    # Sentry (optional)
    sentry_dsn = os.getenv("SENTRY_DSN")
    if sentry_dsn:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(dsn=sentry_dsn, integrations=[FastApiIntegration()], traces_sample_rate=1.0)
        logger.info("[SENTRY] Sentry initialised.")

    logger.info("[OK] FocusOS backend ready on port %d", settings.PORT)

    yield  # ← app is running

    # ── Shutdown ──────────────────────────────────────────────────────────────
    from database.db import engine
    await engine.dispose()
    logger.info("[STOP] Database connections closed.")


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="FocusOS API",
        version=settings.APP_VERSION,
        description="The AI-Powered Productivity Backend",
        docs_url="/api/docs" if settings.is_dev else None,
        redoc_url="/api/redoc" if settings.is_dev else None,
        lifespan=lifespan,
    )

    # ── Rate limiting ─────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "X-Correlation-ID"],
        expose_headers=["Content-Type", "Authorization", "X-Correlation-ID"],
    )

    # ── Security headers middleware ───────────────────────────────────────────
    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # ── Correlation ID middleware ─────────────────────────────────────────────
    @app.middleware("http")
    async def correlation_id(request: Request, call_next):
        import uuid
        req_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = req_id
        return response

    # ── Global exception handler ──────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception):
        import uuid, traceback
        error_id = str(uuid.uuid4())
        logger.error("Unhandled [%s] %s %s: %s", error_id, request.method, request.url.path, exc)
        if settings.is_dev:
            logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error": {"code": "INTERNAL_SERVER_ERROR",
                     "message": "An unexpected error occurred.", "error_id": error_id}},
        )

    from utils.errors import APIError

    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError):
        return JSONResponse(
            status_code=exc.status,
            content={"status": "error", "error": {"code": exc.code, "message": exc.message, "details": exc.details}},
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    _register_routers(app)

    # ── Root endpoint ─────────────────────────────────────────────────────────
    @app.get("/", tags=["root"])
    async def root():
        return {"name": "FocusOS API", "status": "healthy", "version": settings.APP_VERSION}

    return app


def _register_routers(app: FastAPI) -> None:
    from api.health import router as health_router
    from api.auth import router as auth_router
    from api.tasks import router as tasks_router
    from api.goals import router as goals_router
    from api.notifications import router as notifications_router
    from api.settings import router as settings_router
    from api.users import router as users_router
    from api.analytics import router as analytics_router
    from api.calendar import router as calendar_router
    from api.interventions import router as interventions_router
    from api.orchestration import router as orchestration_router
    from api.agents import router as agents_router
    from api.documents import router as documents_router
    from api.voice import router as voice_router
    from api.reports import router as reports_router
    from api.demo import router as demo_router

    prefix = "/api"
    app.include_router(health_router,        prefix=prefix)
    app.include_router(auth_router,          prefix=prefix)
    app.include_router(tasks_router,         prefix=prefix)
    app.include_router(goals_router,         prefix=prefix)
    app.include_router(notifications_router, prefix=prefix)
    app.include_router(settings_router,      prefix=prefix)
    app.include_router(users_router,         prefix=prefix)
    app.include_router(analytics_router,     prefix=prefix)
    app.include_router(calendar_router,      prefix=prefix)
    app.include_router(interventions_router, prefix=prefix)
    app.include_router(orchestration_router, prefix=prefix)
    app.include_router(agents_router,        prefix=prefix)
    app.include_router(documents_router,     prefix=prefix)
    app.include_router(voice_router,         prefix=prefix)
    app.include_router(reports_router,       prefix=prefix)
    app.include_router(demo_router,          prefix=prefix)


# ── Entry point ───────────────────────────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 50)
    print("  FOCUSOS BACKEND")
    print("=" * 50)
    print(f"  Env:      {settings.APP_ENV}")
    print(f"  Database: {settings.DATABASE_URL.split('@')[-1]}")   # hide credentials
    print(f"  Mistral:  {'Connected' if settings.MISTRAL_API_KEY else 'Disabled'}")
    print(f"  Docs:     http://localhost:{settings.PORT}/api/docs")
    print(f"  Server:   http://localhost:{settings.PORT}")
    print("=" * 50 + "\n")

    uvicorn.run(
        "main:app",
        host="localhost",
        port=settings.PORT,
        reload=settings.is_dev,
        log_level=settings.LOG_LEVEL.lower(),
    )
