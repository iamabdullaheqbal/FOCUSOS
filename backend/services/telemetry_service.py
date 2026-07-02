"""FocusOS — Telemetry Service (fire-and-forget, sync fallback)"""

import time
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class TelemetryService:
    """
    Logs agent execution data. Uses a background thread-safe sync session
    so it can be called from both sync services and async routes without
    requiring await at every call site.
    """

    @staticmethod
    def log_execution(
        agent_name: str,
        action: str,
        status: str,
        start_time: float,
        confidence: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> None:
        try:
            from sqlalchemy import create_engine
            from sqlalchemy.orm import Session
            from config import settings
            from models.telemetry import AgentExecutionLog

            # Build a sync URL from the async one
            sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)

            duration_ms = int((time.time() - start_time) * 1000)
            log = AgentExecutionLog(
                user_id=user_id,
                agent_name=agent_name,
                action=action,
                status=status,
                confidence=confidence,
                execution_time_ms=duration_ms,
                metadata_payload=metadata or {},
            )

            engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
            with Session(engine) as session:
                session.add(log)
                session.commit()
            engine.dispose()
        except Exception as e:
            logger.warning("Telemetry log failed (non-fatal): %s", e)
