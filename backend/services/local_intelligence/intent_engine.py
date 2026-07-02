from typing import Dict, Any, Tuple
from services.local_intelligence.normalizer import Normalizer
from services.local_intelligence.semantic_matcher import SemanticMatcher
from services.local_intelligence.entity_extractor import EntityExtractor
from services.local_intelligence.confidence_engine import ConfidenceEngine
from services.local_intelligence.context_memory import ContextMemory

class IntentEngine:
    """
    Primary local NLU entrypoint. Combines normalization, entity extraction,
    fuzzy semantic matching, and confidence calculation to generate a structured NLP payload.
    """
    
    @classmethod
    def process(cls, raw_transcript: str, user_id: str = None, source: str = "voice") -> Dict[str, Any]:
        normalized = Normalizer.normalize(raw_transcript)
        
        # 1. Semantic Match
        matched_cmd, fuzzy_score, keyword = SemanticMatcher.find_best_match(normalized)
        
        # Default fallback if absolutely no match is found
        if not matched_cmd:
            return {
                "intent": "unknown",
                "entities": {},
                "confidence": 0.0,
                "agent": "Gemini",
                "normalized_transcript": normalized
            }
            
        intent = matched_cmd["intent"]
        
        # 2. Extract Entities
        entities = EntityExtractor.extract(normalized, intent)
        
        # 3. Context & Confidence
        context = ContextMemory.get_context(user_id) if user_id else {}
        confidence = ConfidenceEngine.calculate_confidence(matched_cmd, fuzzy_score, entities, context)
        
        # 4. Update Context Memory
        if user_id and intent != "unknown":
            ContextMemory.update_context(user_id, intent, entities, source)
            
        return {
            "intent": intent,
            "entities": entities,
            "confidence": confidence,
            "agent": matched_cmd["agent"] if intent != "unknown" else "Gemini",
            "normalized_transcript": normalized
        }
