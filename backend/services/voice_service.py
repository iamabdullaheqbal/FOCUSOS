"""FocusOS — Voice Service"""

from typing import Dict, Any, Optional


class VoiceService:

    @classmethod
    def process_voice_command(cls, transcript: str, ai_service, user_id: Optional[str] = None, timezone: str = "UTC") -> Dict[str, Any]:
        from services.local_intelligence.execution_engine import ExecutionEngine
        result = ExecutionEngine.execute("voice", transcript, ai_service, user_id, timezone=timezone)
        return {
            "transcript": transcript,
            "nlu": {
                "intent": result.get("intent"),
                "entities": result.get("entities"),
                "confidence": result.get("confidence"),
                "voice_response": result.get("message"),
            },
            "execution": {"status": result.get("status"), "action": result.get("action")},
            "structured_result": result,
        }
