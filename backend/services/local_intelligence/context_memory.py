from cachetools import TTLCache
from typing import Dict, Any

class ContextMemory:
    """
    Maintains short-term contextual memory (2 minutes) for each user.
    Supports follow-up questions, conversation references, and short-term memory.
    """
    
    # Cache up to 1000 users for 120 seconds
    _memory = TTLCache(maxsize=1000, ttl=120)
    
    @classmethod
    def update_context(cls, user_id: str, intent: str, entities: Dict[str, Any], source: str):
        if not user_id:
            return
            
        cls._memory[user_id] = {
            "last_intent": intent,
            "last_entities": entities,
            "source": source
        }
        
    @classmethod
    def get_context(cls, user_id: str) -> Dict[str, Any]:
        if not user_id:
            return {}
        return cls._memory.get(user_id, {})
    
    @classmethod
    def clear_context(cls, user_id: str):
        if user_id in cls._memory:
            del cls._memory[user_id]
