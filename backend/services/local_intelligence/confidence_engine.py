from typing import Dict, Any, Tuple

class ConfidenceEngine:
    """
    Calculates final confidence score based on fuzzy matching, entity completeness,
    and semantic heuristics. Supports bands (90-100, 70-89, <70).
    """
    
    @classmethod
    def calculate_confidence(cls, cmd_def: Dict[str, Any], fuzzy_score: float, entities: Dict[str, Any], context: Dict[str, Any] = None) -> float:
        if not cmd_def:
            return 0.0
            
        base_confidence = fuzzy_score
        
        # Penalize if required entities are missing
        required_entities = cmd_def.get("required_entities", [])
        if required_entities:
            missing_count = sum(1 for e in required_entities if e not in entities)
            if missing_count > 0:
                base_confidence -= (missing_count * 20.0)
                
                # Check if context can fill it in
                if context and context.get("last_intent") == cmd_def.get("intent"):
                    base_confidence += 15.0 # Partial recovery due to context
                    
        # Ensure it doesn't drop below 0 or exceed 100
        return max(0.0, min(100.0, base_confidence))
