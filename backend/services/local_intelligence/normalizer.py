import re

class Normalizer:
    """
    Normalizes voice transcripts by removing filler words, fixing capitalization,
    and standardizing input for the NLP engines.
    """
    
    FILLER_WORDS = {
        r'\bumm\b', r'\buh\b', r'\bah\b', r'\ber\b', r'\blike\b', 
        r'\bso um\b', r'\byou know\b', r'\bI mean\b', r'\bbasically\b',
        r'\bjust\b', r'\bactually\b'
    }

    @classmethod
    def normalize(cls, transcript: str) -> str:
        if not transcript:
            return ""
            
        text = transcript.lower()
        
        # Remove filler words
        for filler in cls.FILLER_WORDS:
            text = re.sub(filler, '', text)
            
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:]
            
        return text
