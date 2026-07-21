"""
0xVerdict — Pydantic Data Models
Enforces the shared JSON contract between all three engines.
"""

from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, Literal
from datetime import datetime


class ScanRequest(BaseModel):
    target_url: str

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v.rstrip("/")


class RemediationCode(BaseModel):
    language: str
    secure_code_example: str


class AIAnalysis(BaseModel):
    verdict: Literal["Confirmed", "Needs Manual Verification", "Likely False Positive"]
    severity_classified: Literal["Critical", "High", "Medium", "Low", "Info"]
    priority_recommendation: Literal["Immediate", "High", "Normal", "Low"]
    priority_reason: str
    confidence_reason: str
    root_cause: str
    developer_explanation: str
    fix_recommendation: str
    remediation_code: RemediationCode
    manual_verification_guide: str


class Finding(BaseModel):
    id: str
    type: str
    endpoint: str
    payload: str
    raw_evidence: str
    scanner_severity: Literal["Critical", "High", "Medium", "Low", "Info"]
    ai_analysis: Optional[AIAnalysis] = None


class ReconData(BaseModel):
    pages_found: list[str]
    forms_found: list[dict]
    headers_collected: dict[str, str]


class ScanSummary(BaseModel):
    total_findings: int
    confirmed: int
    needs_verification: int
    false_positives: int
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class ScanResult(BaseModel):
    scan_id: str
    target_url: str
    scan_date: str
    scan_status: str
    scan_duration: str
    pipeline_message: str
    summary: ScanSummary
    recon_data: Optional[ReconData] = None
    findings: list[Finding] = []


class ScanStatus(BaseModel):
    scan_id: str
    scan_status: str
    pipeline_message: str
    progress_percent: int
