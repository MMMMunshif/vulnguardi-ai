import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, status

from .config import Settings, get_settings
from .nvidia import NvidiaNimClient
from .schemas import Recommendation, VulnerabilityContext

app = FastAPI(
    title="VulnGuard NVIDIA AI Service",
    version="1.0.0",
    docs_url="/docs",
)


def authorize(
    x_ai_service_token: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if not settings.ai_service_token or not x_ai_service_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    if not secrets.compare_digest(x_ai_service_token, settings.ai_service_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@app.get("/health")
def health(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    return {
        "status": "ok",
        "provider": "nvidia-nim",
        "model": settings.nvidia_model,
        "configured": str(bool(settings.nvidia_api_key)).lower(),
    }


@app.post(
    "/recommendations/remediation",
    response_model=Recommendation,
    dependencies=[Depends(authorize)],
)
async def remediation_recommendation(
    context: VulnerabilityContext,
    settings: Settings = Depends(get_settings),
) -> Recommendation:
    try:
        return await NvidiaNimClient(settings).recommend(context)
    except (httpx.HTTPError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"NVIDIA recommendation unavailable: {error}",
        ) from error
