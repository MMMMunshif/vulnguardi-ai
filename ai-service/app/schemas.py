from typing import Literal

from pydantic import BaseModel, Field


class VulnerabilityContext(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=5000)
    softwareName: str | None = Field(default=None, max_length=200)
    affectedVersion: str | None = Field(default=None, max_length=100)
    fixedVersion: str | None = Field(default=None, max_length=100)
    exploitAvailability: str | None = Field(default=None, max_length=100)
    fixAvailability: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, max_length=100)
    cveId: str | None = Field(default=None, max_length=30)


class Recommendation(BaseModel):
    priority: Literal["Critical", "High", "Medium", "Low"]
    actionType: Literal[
        "UPDATE_SOFTWARE",
        "CONFIGURATION_CHANGE",
        "REMOVE_SOFTWARE",
        "ACCEPT_RISK",
        "VERIFY_PATCH",
        "OTHER",
    ]
    recommendedFix: str = Field(min_length=1, max_length=3000)
    explanation: str = Field(min_length=1, max_length=5000)
    remediationSteps: list[str] = Field(min_length=1, max_length=8)
