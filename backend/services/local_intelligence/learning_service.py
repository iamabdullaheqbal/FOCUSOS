"""FocusOS — Learning Service (sync)"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class LearningService:

    @classmethod
    def sanitize_transcript(cls, text: str) -> str:
        if not text:
            return ""
        return re.sub(r'(?i)(password|pass|jwt|token|secret)[\s:=]+[\w\-._]+', r'\1 [REDACTED]', text)

    @classmethod
    def log_command(cls, user_id: Optional[str], transcript: str, detected_intent: str,
                    confidence: float, source: str, execution_outcome: str) -> None:
        if not transcript or not transcript.strip():
            return
        try:
            from models.intelligence import CommandLog
            session, engine = _sync_session()
            with session:
                session.add(CommandLog(
                    user_id=user_id, source=source,
                    transcript=cls.sanitize_transcript(transcript),
                    detected_intent=detected_intent,
                    confidence_score=confidence,
                    execution_outcome=execution_outcome,
                ))
                session.commit()
            engine.dispose()
        except Exception as e:
            logger.error("log_command failed: %s", e)

    @classmethod
    def log_suggestion_outcome(cls, user_id: Optional[str], suggestion_id: str, source: str, accepted: bool) -> None:
        try:
            from models.intelligence import CommandLog
            session, engine = _sync_session()
            with session:
                session.add(CommandLog(
                    user_id=user_id, source=source,
                    transcript=f"Suggestion interaction: {suggestion_id}",
                    detected_intent="system_suggestion",
                    confidence_score=100.0,
                    execution_outcome="accepted_suggestion" if accepted else "rejected_suggestion",
                ))
                session.commit()
            engine.dispose()
        except Exception as e:
            logger.error("log_suggestion_outcome failed: %s", e)

    @classmethod
    def log_correction(cls, user_id: Optional[str], original_transcript: str, corrected_intent: str, source: str) -> None:
        try:
            from models.intelligence import CommandLog
            session, engine = _sync_session()
            with session:
                session.add(CommandLog(
                    user_id=user_id, source=source,
                    transcript=cls.sanitize_transcript(original_transcript),
                    detected_intent=corrected_intent,
                    confidence_score=100.0,
                    execution_outcome="user_correction",
                ))
                session.commit()
            engine.dispose()
        except Exception as e:
            logger.error("log_correction failed: %s", e)
