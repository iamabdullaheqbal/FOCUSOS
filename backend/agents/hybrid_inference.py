import logging

logger = logging.getLogger(__name__)

def execute_hybrid(local_func, ai_func, threshold: int):
    """
    Executes local inference. If confidence < threshold, falls back to Mistral.
    """
    local_result = None
    confidence = 0
    try:
        local_result = local_func()
        confidence = local_result.get("_system_confidence", 0)
        
        if confidence >= threshold:
            logger.info(f"Local inference succeeded with confidence {confidence} (threshold {threshold})")
            local_result.pop("_system_confidence", None)
            local_result["_inference_source"] = "local"
            local_result["enhancement"] = {"used": False, "provider": "none"}
            local_result["_system_confidence"] = confidence
            return local_result
            
        logger.info(f"Local inference confidence {confidence} below threshold {threshold}. Falling back to Mistral.")
    except Exception as e:
        logger.warning(f"Local inference failed: {e}. Falling back to Mistral.")
        
    # Mistral Enhancement Layer
    try:
        ai_result = ai_func()
        if isinstance(ai_result, dict):
            ai_result["_inference_source"] = "local"
            ai_result["enhancement"] = {"used": True, "provider": "mistral"}
            ai_result["_system_confidence"] = 100
        return ai_result
    except Exception as e:
        logger.error(f"Mistral fallback failed: {e}. Recovering with local result if available.")
        if local_result and isinstance(local_result, dict):
            local_result.pop("_system_confidence", None)
            local_result["_inference_source"] = "local"
            local_result["enhancement"] = {"used": False, "provider": "none", "fallback_error": str(e)}
            local_result["_system_confidence"] = confidence
            local_result["fallback_triggered"] = True
            local_result["fallback_failed"] = True
            local_result["fallback_reason"] = str(e)
            local_result["pipeline_continued"] = True
            return local_result
        raise e

