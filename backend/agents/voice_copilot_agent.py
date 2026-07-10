"""
DeadlineOS — Voice Copilot Agent
================================
Translates natural language voice transcripts into structured intents and entities.
Acts as the NLU router for the entire OS.
"""

from typing import Dict, Any
from services.mistral_service import MistralService

class VoiceCopilotAgent:

    def __init__(self, ai_service):
        self.ai_service = ai_service

    def parse_transcript(self, transcript: str) -> Dict[str, Any]:
        prompt = f"""
        You are the Voice Copilot NLU Engine for an AI Productivity Operating System.
        Analyze the following voice transcript: "{transcript}"

        Determine the user's intent. The allowed intents are:
        - meeting_scheduling   ← use this when the user wants to schedule, book, set up, or arrange a meeting or appointment
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
        - navigation
        - unknown

        IMPORTANT RULES:
        - If the transcript mentions "meeting", "appointment", "call", or "schedule with <person>", the intent MUST be "meeting_scheduling".
        - For meeting_scheduling, extract "attendee" (the person's name after "with"), "target_date" (ISO 8601 datetime string for when the meeting starts, e.g. "2026-07-10T21:00:00+00:00"), and "duration" (e.g. "1 hour").
        - For target_date, resolve relative times like "today at 9pm", "tomorrow at 3pm" into a full ISO 8601 datetime. Today's date is {__import__('datetime').datetime.utcnow().strftime('%Y-%m-%d')}.
        - Generate a 'voice_response' that confirms the action taken (concise, professional, agentic).
        - Estimate your confidence in this intent detection (0-100).
        - Set "agents_triggered" to ["MeetingScheduler"] when intent is meeting_scheduling.
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
                        "attendee":    {"type": "STRING"},
                        "target_date": {"type": "STRING"},
                        "duration":    {"type": "STRING"},
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
            return self.ai_service.generate_structured(prompt, transcript, schema)
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
