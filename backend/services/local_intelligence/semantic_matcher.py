from rapidfuzz import process, fuzz
from typing import Dict, Any, Tuple
from services.local_intelligence.command_library import CommandLibrary

class SemanticMatcher:
    """
    Uses RapidFuzz to find the closest semantic match for a normalized transcript
    against the known command keywords.
    """
    
    @classmethod
    def find_best_match(cls, normalized_transcript: str) -> Tuple[Dict[str, Any], float, str]:
        """
        Returns (Matched Command Dict, Confidence Score 0-100, Matched Keyword)
        """
        if not normalized_transcript:
            return None, 0.0, ""
            
        all_commands = CommandLibrary.get_all_commands()
        
        best_cmd = None
        highest_score = 0.0
        best_keyword = ""
        
        # We can extract the keyword that matched best
        for cmd in all_commands:
            keywords = cmd.get("keywords", [])
            
            # Using fuzz.partial_ratio is good for voice commands where 
            # the user might say extra words before or after the command.
            # WRatio is even better for general fuzzy matching.
            result = process.extractOne(normalized_transcript.lower(), keywords, scorer=fuzz.WRatio)
            
            if result:
                match_str, score, _ = result
                if score > highest_score:
                    highest_score = score
                    best_cmd = cmd
                    best_keyword = match_str
                    
        return best_cmd, highest_score, best_keyword
