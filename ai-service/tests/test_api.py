from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app


def settings() -> Settings:
    return Settings(
        nvidia_api_key="test-nvidia-key",
        nvidia_model="nvidia/test-nemotron",
        ai_service_token="test-service-token",
    )


app.dependency_overrides[get_settings] = settings
client = TestClient(app)


def test_health_reports_provider_configuration() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "provider": "nvidia-nim",
        "model": "nvidia/test-nemotron",
        "configured": "true",
    }


def test_recommendation_requires_service_token() -> None:
    response = client.post(
        "/recommendations/remediation",
        json={"title": "Remote code execution"},
    )

    assert response.status_code == 401


def test_recommendation_rejects_invalid_context() -> None:
    response = client.post(
        "/recommendations/remediation",
        headers={"X-AI-Service-Token": "test-service-token"},
        json={"title": ""},
    )

    assert response.status_code == 422
