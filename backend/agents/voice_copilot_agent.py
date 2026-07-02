"""
DeadlineOS — Voice Copilot Agent
================================
Translates natural language voice transcripts into structured intents and entities.
Acts as the NLU router for the entire OS.
"""

from typing import Dict, Any
from services.gemini_service import GeminiService

class VoiceCopilotAgent:

    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def parse_transcript(self, transcript: str) -> Dict[str, Any]:
        prompt = f"""
        You are the Voice Copilot NLU Engine for an AI Productivity Operating System.
        Analyze the following voice transcript: "{transcript}"

        Determine the user's intent. The allowed intents are:
        - task_creation
        - goal_creation
        - planning
        - rescue
        - digital_twin
        - analytics_query
        - calendar_query
        - goal_query
        - habit_query
        - intervention_query
        - unknown

        Extract any relevant entities (e.g. target_name, target_date).
        Generate a 'voice_response' that the system will speak back to the user (keep it concise, professional, and agentic). If the intent is unknown, suggest a valid action.
        Estimate your confidence in this intent detection (0-100).
        Identify which backend agents need to be invoked to fulfill this request.
        """
        
        schema = {
            "type": "OBJECT",
            "properties": {
                "intent": {"type": "STRING"},
                "confidence": {"type": "INTEGER"},
                "entities": {
                    "type": "OBJECT",
                    "properties": {
                        "target_name": {"type": "STRING"},
                        "target_date": {"type": "STRING"}
                    }
                },
                "voice_response": {"type": "STRING"},
                "agents_triggered": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                }
            },
            "required": ["intent", "confidence", "entities", "voice_response", "agents_triggered"]
        }
        
        try:
            return self.gemini.generate_structured(prompt, transcript, schema)
        except Exception as e:
            import logging
            logging.error(f"VoiceCopilotAgent Error: {e}")
            return {
                "intent": "unknown",
                "confidence": 0,
                "entities": {},
                "voice_response": "I encountered an error understanding that request.",
                "agents_triggered": []
            }
