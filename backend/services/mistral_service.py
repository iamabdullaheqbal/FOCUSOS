"""
FocusOS — Mistral AI Service
============================
Central wrapper around the Mistral AI SDK.
"""

import base64
import hashlib
import json
import logging
import time
from typing import Any, Generator

from mistralai import Mistral
from cachetools import TTLCache

logger = logging.getLogger(__name__)


class MistralServiceError(Exception):
    """Raised when the Mistral API returns an unrecoverable error."""


class MistralService:
    """
    Singleton-style service for all Mistral API interactions.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "mistral-large-latest",
        vision_model: str = "pixtral-12b-latest",
        max_retries: int = 3,
        retry_delay: float = 1.5,
        cache_ttl: int = 300,
        cache_maxsize: int = 100,
        timeout: float = 15.0,
    ) -> None:
        if not api_key:
            raise ValueError(
                "MISTRAL_API_KEY is not set. "
                "Add it to your .env file: MISTRAL_API_KEY=your_key_here"
            )

        self._client = Mistral(api_key=api_key)
        self._model_name = model
        self._vision_model_name = vision_model
        self._max_retries = max_retries
        self._retry_delay = retry_delay
        self._timeout = timeout

        # In-memory TTL cache keyed by SHA-256 of the full prompt inputs
        self._cache: TTLCache = TTLCache(maxsize=cache_maxsize, ttl=cache_ttl)

        logger.info(
            "MistralService initialised | model=%s | vision_model=%s | timeout=%ss",
            model,
            vision_model,
            timeout,
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _cache_key(*parts: str) -> str:
        """Create a deterministic cache key from one or more strings."""
        combined = "|".join(parts)
        return hashlib.sha256(combined.encode()).hexdigest()

    def _call_with_retry(self, callable_fn, *args, **kwargs) -> Any:
        """
        Execute `callable_fn` with exponential back-off retry.
        """
        delay = self._retry_delay
        last_error: Exception | None = None

        for attempt in range(1, self._max_retries + 1):
            try:
                # Mistral API calls run synchronously here
                return callable_fn(*args, **kwargs)
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Mistral call failed (attempt %d/%d): %s",
                    attempt,
                    self._max_retries,
                    exc,
                )
                if attempt < self._max_retries:
                    time.sleep(delay)
                    delay *= 2  # exponential back-off

        raise MistralServiceError(
            f"Mistral API failed after {self._max_retries} attempts. Last Error: {last_error}"
        ) from last_error

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Extract and parse JSON from a response."""
        stripped = text.strip()
        if stripped.startswith("```"):
            lines = stripped.split("\n")
            inner_lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
            stripped = "\n".join(inner_lines)
            if stripped.startswith("json"):
                stripped = stripped[4:].strip()

        try:
            return json.loads(stripped)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse Mistral JSON response: %s\nRaw: %s", exc, text)
            raise MistralServiceError(
                f"Mistral returned invalid JSON: {exc}\nRaw response: {text[:500]}"
            ) from exc

    # ── Public API ────────────────────────────────────────────────────────────

    def generate_text(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.7,
        use_cache: bool = True,
    ) -> str:
        cache_key = self._cache_key("text", prompt, system_instruction or "", str(temperature))

        if use_cache and cache_key in self._cache:
            logger.debug("Cache HIT for generate_text (key=%s…)", cache_key[:12])
            return self._cache[cache_key]

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        def _call():
            response = self._client.chat.complete(
                model=self._model_name,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content

        result: str = self._call_with_retry(_call)

        if use_cache:
            self._cache[cache_key] = result

        logger.debug("generate_text completed | chars=%d", len(result))
        return result

    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict | None = None,
        temperature: float = 0.2,
        use_cache: bool = True,
    ) -> dict:
        cache_key = self._cache_key("structured", system_prompt, user_prompt)

        if use_cache and cache_key in self._cache:
            logger.debug("Cache HIT for generate_structured (key=%s…)", cache_key[:12])
            return self._cache[cache_key]

        # Append strict JSON instruction
        enhanced_system = (
            system_prompt.strip()
            + "\n\nCRITICAL: Your response MUST be valid JSON only. "
            "No markdown code fences, no explanation outside the JSON object. "
            "Start your response with '{' and end with '}'."
        )

        full_user_prompt = user_prompt
        if schema:
            schema_hint = json.dumps(schema, indent=2)
            full_user_prompt = (
                f"{user_prompt}\n\n"
                f"Adhere strictly to this JSON schema:\n{schema_hint}"
            )

        messages = [
            {"role": "system", "content": enhanced_system},
            {"role": "user", "content": full_user_prompt}
        ]

        def _call():
            response = self._client.chat.complete(
                model=self._model_name,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=temperature,
            )
            return response.choices[0].message.content

        raw_text: str = self._call_with_retry(_call)
        result: dict = self._extract_json(raw_text)

        if use_cache:
            self._cache[cache_key] = result

        logger.debug(
            "generate_structured completed | keys=%s",
            list(result.keys()),
        )
        return result

    def generate_vision(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/png",
        structured: bool = True,
        temperature: float = 0.2,
    ) -> dict | str:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        enhanced_prompt = prompt
        if structured:
            enhanced_prompt += (
                "\n\nReturn ONLY valid JSON. No markdown code fences. "
                "Start with '{' and end with '}'."
            )

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": enhanced_prompt},
                    {
                        "type": "image_url",
                        "image_url": f"data:{mime_type};base64,{base64_image}"
                    }
                ]
            }
        ]

        def _call():
            response = self._client.chat.complete(
                model=self._vision_model_name,
                messages=messages,
                response_format={"type": "json_object"} if structured else None,
                temperature=temperature,
            )
            return response.choices[0].message.content

        raw_text: str = self._call_with_retry(_call)

        if structured:
            return self._extract_json(raw_text)
        return raw_text

    def stream_response(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.7,
    ) -> Generator[str, None, None]:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        try:
            stream_response = self._client.chat.complete(
                model=self._model_name,
                messages=messages,
                stream=True,
                temperature=temperature,
            )
            for chunk in stream_response:
                content = chunk.data.choices[0].delta.content
                if content is not None:
                    yield content
        except Exception as exc:
            logger.error("Streaming error: %s", exc)
            raise MistralServiceError(f"Streaming failed: {exc}") from exc

    def health_check(self) -> dict:
        try:
            response = self._client.chat.complete(
                model=self._model_name,
                messages=[{"role": "user", "content": "Reply with exactly: {'status': 'ok'}"}],
                response_format={"type": "json_object"},
                temperature=0,
            )
            return {
                "status": "ok",
                "model": self._model_name,
                "message": "Mistral API reachable",
                "raw": response.choices[0].message.content.strip(),
            }
        except Exception as exc:
            logger.error("Mistral health check failed: %s", exc)
            return {
                "status": "error",
                "model": self._model_name,
                "message": str(exc),
            }

    def clear_cache(self) -> int:
        count = len(self._cache)
        self._cache.clear()
        logger.info("MistralService cache cleared (%d entries removed)", count)
        return count
