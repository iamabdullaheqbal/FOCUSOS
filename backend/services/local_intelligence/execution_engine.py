import time
from typing import Dict, Any
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
    def execute(cls, source: str, transcript: str, gemini_service, user_id: str = None) -> Dict[str, Any]:
        t0 = time.time()
        
        # 1. Pipeline Execution
        nlu_result = IntentEngine.process(transcript, user_id)
        intent = nlu_result.get("intent")
        confidence = nlu_result.get("confidence", 0)
        entities = nlu_result.get("entities", {})
        agent_name = nlu_result.get("agent", "System")
        
        trace = [source.capitalize(), "Intent Engine", f"Confidence ({confidence}%)"]
        used_gemini = False
        message = ""
        action = "none"
        status = "unknown"
        
        # 2. Confidence Banding & Gemini Fallback
        if intent == "unknown" or confidence < 70:
            used_gemini = True
            trace.append("Gemini (Fallback)")
            try:
                agent = VoiceCopilotAgent(gemini_service)
                # Truncate to 500 chars for documents to avoid Gemini timeout
                short_transcript = transcript[:500] if len(transcript) > 500 else transcript
                gemini_nlu = agent.parse_transcript(short_transcript)
                intent = gemini_nlu.get("intent", "unknown")
                entities.update(gemini_nlu.get("entities", {}))
                confidence = gemini_nlu.get("confidence", 50)
                message = gemini_nlu.get("voice_response", "")
                agent_name = "GeminiAgent"
            except Exception as gemini_err:
                import logging
                logging.getLogger(__name__).warning(f"Gemini fallback failed: {gemini_err}")
                intent = "document_analysis"
                confidence = 60
                agent_name = "DocumentAgent"
                message = "Document processed with local intelligence."

            if intent == "unknown":
                intent = "document_analysis"
                message = "Document content extracted and analyzed."

            LearningService.log_command(user_id, transcript[:200], intent, confidence, source, "gemini_fallback" if intent != "unknown" else "unknown")
        elif confidence < 90:
            # Clarification Band (70-89)
            # In V3, this might trigger a confirmation prompt in the UI. For now, we proceed but log it.
            LearningService.log_command(user_id, transcript, intent, confidence, source, "clarification_band")
            
        # 3. Agent Execution via Registry
        executor = AgentRegistry.get_executor(agent_name)
        data = {}
        
        if executor:
            trace.append(agent_name)
            context = {
                "user_id": user_id, 
                "confidence": confidence, 
                "source": source,
                "gemini_service": gemini_service,
                "intent": intent
            }
            try:
                exec_result = executor(entities, context)
                action = exec_result.get("action", action)
                status = exec_result.get("status", status)
                data = exec_result.get("data", {})
                if not message:
                    message = exec_result.get("message", "Executed successfully.")
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Execution Error: {e}")
                status = "error"
                message = "I encountered an error executing that command."
        else:
            trace.append("Router (Fallback)")
            status = "Agent not registered"
            if not message:
                message = "I couldn't find the right agent to handle this."
                
        trace.append("Completed")
        execution_time_ms = int((time.time() - t0) * 1000)
        
        # 4. Telemetry Logging
        try:
            TelemetryService.log_execution("Local Intelligence", f"{source.capitalize()} Execution", "success", t0, confidence)
        except Exception:
            pass

        return {
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "agent": agent_name,
            "action": action,
            "status": status,
            "message": message,
            "data": data,
            "execution_time_ms": execution_time_ms,
            "used_gemini": used_gemini,
            "trace": trace
        }
