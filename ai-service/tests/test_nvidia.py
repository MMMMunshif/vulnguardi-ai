import json

import httpx
import pytest

from app.config import Settings
from app.nvidia import NvidiaNimClient
from app.schemas import VulnerabilityContext


class FakeResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self.payload


class FakeAsyncClient:
    response_payload: dict = {}
    request: dict = {}

    def __init__(self, **kwargs):
        self.timeout = kwargs.get("timeout")

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, url: str, **kwargs):
        FakeAsyncClient.request = {"url": url, **kwargs}
        return FakeResponse(FakeAsyncClient.response_payload)


@pytest.mark.asyncio
async def test_generates_validated_nemotron_recommendation(monkeypatch) -> None:
    recommendation = {
        "priority": "Critical",
        "actionType": "UPDATE_SOFTWARE",
        "recommendedFix": "Deploy the fixed version.",
        "explanation": "A public exploit is available.",
        "remediationSteps": ["Test the update.", "Deploy the update."],
    }
    FakeAsyncClient.response_payload = {
        "choices": [{"message": {"content": f"```json\n{json.dumps(recommendation)}\n```"}}]
    }
    monkeypatch.setattr(httpx, "AsyncClient", FakeAsyncClient)
    client = NvidiaNimClient(
        Settings(
            nvidia_api_key="test-key",
            nvidia_base_url="https://integrate.api.nvidia.com/v1/",
            nvidia_model="nvidia/test-nemotron",
        )
    )

    result = await client.recommend(VulnerabilityContext(title="RCE"))

    assert result.priority == "Critical"
    assert FakeAsyncClient.request["url"] == (
        "https://integrate.api.nvidia.com/v1/chat/completions"
    )
    assert FakeAsyncClient.request["headers"]["Authorization"] == "Bearer test-key"
    assert FakeAsyncClient.request["json"]["model"] == "nvidia/test-nemotron"


@pytest.mark.asyncio
async def test_requires_nvidia_api_key() -> None:
    client = NvidiaNimClient(Settings(nvidia_api_key=""))

    with pytest.raises(RuntimeError, match="NVIDIA_API_KEY"):
        await client.recommend(VulnerabilityContext(title="RCE"))


def test_rejects_non_json_model_output() -> None:
    with pytest.raises(ValueError, match="valid JSON"):
        NvidiaNimClient._parse_json("not json")
