import time
from typing import Dict, Any, Optional
from services.local_intelligence.intent_engine import IntentEngine
from services.local_intelligence.agent_registry import AgentRegistry
from services.local_intelligence.learning_service import LearningService
from services.telemetry_service import TelemetryService
from agents.voice_copilot_agent import VoiceCopilotAgent


class ExecutionEngine:
    """
    Unified entry point for Local Intelligence Engine execution.
    Handles all NLP pipelines (Voice, Vision, Document).
    """

    @classmethod
    def execute(
        cls,
        source: str,
        transcript: str,
        ai_service,
        user_id: Optional[str] = None,
        timezone: str = "UTC",
    ) -> Dict[str, Any]:
        t0 = time.time()

        # 1. Local NLU pipeline
        nlu_result   = IntentEngine.process(transcript, user_id, timezone=timezone)
        intent       = nlu_result.get("intent")
        confidence   = nlu_result.get("confidence", 0)
        entities     = nlu_result.get("entities", {})
        agent_name   = nlu_result.get("agent", "System")

        trace        = [source.capitalize(), "Intent Engine", f"Confidence ({confidence}%)"]
        used_mistral = False
        message      = ""
        action       = "none"
        status       = "unknown"

        # 2. Confidence banding — fall back to Mistral if low
        if intent == "unknown" or confidence < 70:
            used_mistral = True
            trace.append("Mistral (Fallback)")
            try:
                agent = VoiceCopilotAgent(ai_service)
                short_transcript = transcript[:500]
                mistral_nlu = agent.parse_transcript(short_transcript)
                intent     = mistral_nlu.get("intent", "unknown")
                entities.update(mistral_nlu.get("entities", {}))
                confidence = mistral_nlu.get("confidence", 50)
                message    = mistral_nlu.get("voice_response", "")
                # Resolve agent_name from the triggered agents list, falling back to registry lookup
                triggered = mistral_nlu.get("agents_triggered", [])
                if triggered:
                    agent_name = triggered[0]
                else:
                    # Map intent → canonical agent name
                    _INTENT_AGENT_MAP = {
                        "meeting_scheduling": "MeetingScheduler",
                        "task_creation":      "TaskService",
                        "goal_creation":      "GoalService",
                        "planning":           "PlanningAgent",
                        "rescue":             "RescueAgent",
                        "digital_twin":       "DigitalTwinAgent",
                        "navigation":         "Navigation",
                        "calendar_query":     "Navigation",
                        "analytics_query":    "Navigation",
                    }
                    agent_name = _INTENT_AGENT_MAP.get(intent, "System")
            except Exception as err:
                import logging
                logging.getLogger(__name__).warning("Mistral fallback failed: %s", err)
                intent     = "document_analysis"
                confidence = 60
                agent_name = "DocumentAgent"
                message    = "Document processed with local intelligence."

            if intent == "unknown":
                intent  = "document_analysis"
                message = "Document content extracted and analyzed."

            LearningService.log_command(
                user_id, transcript[:200], intent, confidence, source,
                "mistral_fallback" if intent != "unknown" else "unknown",
            )

        elif confidence < 90:
            # Clarification band (70-89) — proceed but log
            LearningService.log_command(
                user_id, transcript, intent, confidence, source, "clarification_band"
            )

        # 3. Agent execution via registry
        executor = AgentRegistry.get_executor(agent_name)
        data     = {}

        if executor:
            trace.append(agent_name)
            context = {
                "user_id":    user_id,
                "confidence": confidence,
                "source":     source,
                "ai_service": ai_service,
                "intent":     intent,
                "timezone":   timezone,
            }
            # Inject the raw transcript so executors like MeetingScheduler can parse it
            entities["_original_transcript"] = transcript
            try:
                exec_result = executor(entities, context)
                action  = exec_result.get("action", action)
                status  = exec_result.get("status", status)
                data    = exec_result.get("data", {})
                if not message:
                    message = exec_result.get("message", "Executed successfully.")
            except Exception as e:
                import logging
                logging.getLogger(__name__).error("Execution Error: %s", e)
                status  = "error"
                message = "I encountered an error executing that command."
        else:
            trace.append("Router (Fallback)")
            status = "Agent not registered"
            if not message:
                message = "I couldn't find the right agent to handle this."

        trace.append("Completed")
        execution_time_ms = int((time.time() - t0) * 1000)

        # 4. Telemetry
        try:
            TelemetryService.log_execution(
                "Local Intelligence", f"{source.capitalize()} Execution",
                "success", t0, confidence, user_id=user_id,
            )
        except Exception:
            pass

        return {
            "intent":           intent,
            "confidence":       confidence,
            "entities":         entities,
            "agent":            agent_name,
            "action":           action,
            "status":           status,
            "message":          message,
            "data":             data,
            "execution_time_ms": execution_time_ms,
            "used_mistral":     used_mistral,
            "trace":            trace,
        }
