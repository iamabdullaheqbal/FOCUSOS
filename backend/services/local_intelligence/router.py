from typing import Dict, Any

class Router:
    """
    Routes an intent to the appropriate execution logic.
    """
    
    @classmethod
    def route_local(cls, nlu_payload: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Executes simple commands locally. Returns None if it should be delegated to Gemini.
        """
        intent = nlu_payload.get("intent")
        entities = nlu_payload.get("entities", {})
        
        if intent == "navigation":
            target = entities.get("target_name", "").lower()
            if target in ["dashboard", "settings", "goals", "planner", "calendar", "rescue", "analytics", "documents", "vision"]:
                return {
                    "action": "navigate",
                    "route": f"/{target}",
                    "status": "Navigation requested",
                    "voice_response": f"Opening {target}."
                }
            return {
                "action": "navigate",
                "route": "/dashboard",
                "status": "Navigation requested",
                "voice_response": "I'm not sure which page that is, opening your Dashboard."
            }
            
        if intent == "focus_mode":
            return {
                "action": "navigate",
                "route": "/rescue",
                "status": "Focus Mode requested",
                "voice_response": "Entering Focus Mode in the Rescue Center."
            }
            
        return None
