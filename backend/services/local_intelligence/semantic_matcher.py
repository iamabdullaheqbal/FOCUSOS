from rapidfuzz import process, fuzz
from typing import Dict, Any, Tuple
from services.local_intelligence.command_library import CommandLibrary

class SemanticMatcher:
    """
    Uses RapidFuzz to find the closest semantic match for a normalized transcript
    against the known command keywords.
    """
    
    @classmethod
    def find_best_match(cls, normalized_transcript: str):
        """
        Returns (Matched Command Dict, Confidence Score 0-100, Matched Keyword)
        """
        if not normalized_transcript:
            return None, 0.0, ""

        text_lower = normalized_transcript.lower()
        all_commands = CommandLibrary.get_all_commands()

        # ── Fast-path: hard-coded high-signal triggers ────────────────────────
        # These words are unambiguous enough to skip fuzzy scoring entirely.
        _MEETING_SIGNALS = {"meeting", "appointment", "schedule with", "meet with",
                            "book a call", "schedule a call", "set up a call"}
        if any(sig in text_lower for sig in _MEETING_SIGNALS):
            meeting_cmd = CommandLibrary.get_command_by_intent("meeting_scheduling")
            if meeting_cmd:
                return meeting_cmd, 95.0, "meeting"

        best_cmd    = None
        highest_score = 0.0
        best_keyword  = ""

        for cmd in all_commands:
            keywords = cmd.get("keywords", [])
            result = process.extractOne(
                text_lower, keywords, scorer=fuzz.WRatio
            )
            if result:
                match_str, score, _ = result
                if score > highest_score:
                    highest_score = score
                    best_cmd      = cmd
                    best_keyword  = match_str

        return best_cmd, highest_score, best_keyword
