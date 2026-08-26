import json
import re

import httpx

from .config import Settings
from .schemas import Recommendation, VulnerabilityContext


SYSTEM_PROMPT = """You are a defensive vulnerability remediation assistant for an authorized security team.
Use only the supplied vulnerability data. Never claim that a patch was applied or verified.
Return only a JSON object with these fields:
- priority: one of Critical, High, Medium, Low
- actionType: one of UPDATE_SOFTWARE, CONFIGURATION_CHANGE, REMOVE_SOFTWARE, ACCEPT_RISK, VERIFY_PATCH, OTHER
- recommendedFix: concise actionable guidance
- explanation: a plain-language vulnerability explanation
- remediationSteps: an array containing 1 to 8 concise steps
Do not include markdown or extra fields."""


class NvidiaNimClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def recommend(self, context: VulnerabilityContext) -> Recommendation:
        if not self.settings.nvidia_api_key:
            raise RuntimeError("NVIDIA_API_KEY is not configured")

        url = f"{self.settings.nvidia_base_url.rstrip('/')}/chat/completions"
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.settings.nvidia_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.nvidia_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": context.model_dump_json(exclude_none=True),
                        },
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1200,
                    "stream": False,
                },
            )
            response.raise_for_status()

        payload = response.json()
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as error:
            raise ValueError("NVIDIA NIM response did not contain message content") from error

        return Recommendation.model_validate(self._parse_json(content))

    @staticmethod
    def _parse_json(content: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
        try:
            value = json.loads(cleaned)
        except json.JSONDecodeError as error:
            raise ValueError("NVIDIA NIM response was not valid JSON") from error
        if not isinstance(value, dict):
            raise ValueError("NVIDIA NIM response must be a JSON object")
        return value
