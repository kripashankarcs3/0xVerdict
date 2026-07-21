"""
0xVerdict — AI Orchestration Engine (Member 2: Tasks 2.1–2.7)
Transforms raw scanner findings into developer-ready security intelligence
using an LLM via OpenRouter (OpenAI-compatible API).

Provider: OpenRouter (https://openrouter.ai)
Set environment variables:
  OPENROUTER_API_KEY  — your OpenRouter API key (required)
  OPENROUTER_MODEL    — model to use (optional, default: meta-llama/llama-3.3-70b-instruct:free)
"""

import asyncio
import json
import os
import re
from openai import AsyncOpenAI

# OpenRouter uses OpenAI-compatible API
# Default to a free model; override via OPENROUTER_MODEL env var
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "deepseek/deepseek-v4-flash:free")

client = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL,
)

SYSTEM_PROMPT = """You are a Tier-3 Security Analyst with 15+ years of penetration testing experience.
You have deep expertise in OWASP Top 10 vulnerabilities, web application security, and secure coding practices.

Your job is to analyze raw vulnerability scanner evidence and produce a structured, developer-ready security report.
You are rigorous, evidence-based, and never fabricate findings. If evidence is weak, you say so.

IMPORTANT: You must respond ONLY with a valid JSON object. No preamble, no explanation outside JSON.
Follow the exact schema provided. Every field is required."""

ANALYSIS_SCHEMA = {
    "verdict": "Confirmed | Needs Manual Verification | Likely False Positive",
    "severity_classified": "Critical | High | Medium | Low | Info",
    "priority_recommendation": "Immediate | High | Normal | Low",
    "priority_reason": "Why this priority was chosen (2-3 sentences)",
    "confidence_reason": "What in the evidence supports or weakens your verdict (2-3 sentences)",
    "root_cause": "The underlying coding/config mistake that created this vulnerability",
    "developer_explanation": "Plain-English explanation of how this vulnerability works (3-4 sentences)",
    "fix_recommendation": "Concise, actionable remediation advice",
    "remediation_code": {
        "language": "Primary language detected or best practice language",
        "secure_code_example": "A clean, working secure code snippet showing the fix"
    },
    "manual_verification_guide": "Step-by-step DevTools/Burp guide for manual verification (numbered list)"
}

HEADER_REMEDIATION = {
    "Content-Security-Policy": {
        "language": "Apache/Nginx Config",
        "code": "# Nginx\nadd_header Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';\" always;\n\n# Apache\nHeader always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\""
    },
    "Strict-Transport-Security": {
        "language": "Nginx Config",
        "code": "add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;"
    },
    "X-Frame-Options": {
        "language": "Nginx Config",
        "code": "add_header X-Frame-Options \"SAMEORIGIN\" always;\n# Modern alternative: use CSP frame-ancestors directive"
    },
    "X-Content-Type-Options": {
        "language": "Nginx Config",
        "code": "add_header X-Content-Type-Options \"nosniff\" always;"
    },
    "Referrer-Policy": {
        "language": "Nginx Config",
        "code": "add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;"
    },
    "Permissions-Policy": {
        "language": "Nginx Config",
        "code": "add_header Permissions-Policy \"geolocation=(), microphone=(), camera=()\" always;"
    },
}


class AIOrchestrator:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(3)  # Max 3 concurrent AI calls

    async def analyze_all(self, raw_findings: list[dict]) -> list[dict]:
        """Analyze all findings concurrently (rate-limited)."""
        tasks = [self._analyze_one(finding) for finding in raw_findings]
        return await asyncio.gather(*tasks, return_exceptions=False)

    async def _analyze_one(self, finding: dict) -> dict:
        """Analyze a single finding and attach AI analysis to it."""
        async with self.semaphore:
            try:
                vuln_type = finding.get("type", "")
                # Fast-path for header findings — deterministic analysis
                if "Missing Security Header:" in vuln_type:
                    finding["ai_analysis"] = self._analyze_header_finding(finding)
                    return finding

                # Full AI analysis for SQLi / XSS
                analysis = await self._call_claude(finding)
                finding["ai_analysis"] = analysis
            except Exception as e:
                finding["ai_analysis"] = self._fallback_analysis(finding, str(e))
            return finding

    async def _call_claude(self, finding: dict) -> dict:
        """Build context packet and call LLM via OpenRouter for AI verdict."""
        context_packet = self._build_context_packet(finding)

        response = await client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=1500,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": (
                        f"Analyze this web vulnerability scanner finding and return a JSON response "
                        f"matching this exact schema:\n\n{json.dumps(ANALYSIS_SCHEMA, indent=2)}\n\n"
                        f"FINDING DATA:\n{context_packet}"
                    ),
                },
            ],
            extra_headers={
                "HTTP-Referer": "https://github.com/0xVerdict",
                "X-Title": "0xVerdict Security Scanner",
            },
        )

        raw_text = response.choices[0].message.content.strip()
        # Strip markdown fences if present
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r"\s*```$", "", raw_text, flags=re.MULTILINE)

        parsed = json.loads(raw_text)
        return parsed

    def _build_context_packet(self, finding: dict) -> str:
        """Construct the rich context packet sent to Claude."""
        return f"""
VULNERABILITY TYPE: {finding.get("type", "Unknown")}
ENDPOINT: {finding.get("endpoint", "N/A")}
HTTP METHOD: {finding.get("http_method", "N/A")}
INJECTED PARAMETERS: {finding.get("injected_params", [])}
PAYLOAD USED: {finding.get("payload", "N/A")}
SCANNER INITIAL SEVERITY: {finding.get("scanner_severity", "Unknown")}

RAW EVIDENCE FROM SCANNER:
{finding.get("raw_evidence", "No evidence collected")}

CONTEXT:
The above finding was produced by an automated vulnerability scanner. Your job is to:
1. Evaluate whether this is a genuine vulnerability (Confirmed), requires human review
   (Needs Manual Verification), or is a scanner artifact (Likely False Positive).
2. Re-classify severity based on the actual evidence quality, not just signature match.
3. Provide developer-ready remediation with working secure code.
4. Ensure manual verification steps are tool-independent (browser DevTools preferred).
""".strip()

    def _analyze_header_finding(self, finding: dict) -> dict:
        """Deterministic analysis for missing security header findings."""
        header_name = finding.get("type", "").replace("Missing Security Header: ", "")
        remed = HEADER_REMEDIATION.get(header_name, {
            "language": "HTTP Config",
            "code": f"# Add the missing {header_name} header to your web server configuration"
        })

        severity_map = {
            "Content-Security-Policy": ("High", "High"),
            "Strict-Transport-Security": ("Medium", "High"),
            "X-Frame-Options": ("Medium", "Normal"),
            "X-Content-Type-Options": ("Low", "Normal"),
            "Referrer-Policy": ("Low", "Low"),
            "Permissions-Policy": ("Low", "Low"),
        }
        sev, priority = severity_map.get(header_name, ("Low", "Low"))

        return {
            "verdict": "Confirmed",
            "severity_classified": sev,
            "priority_recommendation": priority,
            "priority_reason": (
                f"The {header_name} header is absent from the HTTP response. "
                "This is a deterministic passive finding — no ambiguity exists. "
                f"Impact severity is {sev} based on what this header protects against."
            ),
            "confidence_reason": (
                "This is a passive header check with 100% confidence. "
                "The header is either present or absent — no false positives possible. "
                "Raw HTTP response headers confirm the absence."
            ),
            "root_cause": (
                f"The web server or application framework is not configured to emit the "
                f"{header_name} response header. This is a server configuration oversight, "
                "not a code-level vulnerability."
            ),
            "developer_explanation": (
                f"The {header_name} HTTP response header is missing from all server responses. "
                "Security headers instruct browsers on how to handle page content securely. "
                "Without this header, browsers apply their default (permissive) security policies, "
                "potentially allowing attacks this header would have mitigated."
            ),
            "fix_recommendation": (
                f"Add the {header_name} header to your web server or reverse proxy configuration. "
                "Apply it globally across all routes, not just specific endpoints."
            ),
            "remediation_code": {
                "language": remed["language"],
                "secure_code_example": remed["code"],
            },
            "manual_verification_guide": (
                f"1. Open the target site in Chrome/Firefox.\n"
                f"2. Open DevTools (F12) → Network tab.\n"
                f"3. Reload the page and click any request.\n"
                f"4. In the 'Response Headers' section, search for '{header_name}'.\n"
                f"5. If absent, the finding is confirmed.\n"
                f"6. Alternatively, run: curl -I {finding.get('endpoint', 'TARGET_URL')} | grep -i '{header_name.lower()}'"
            ),
        }

    def _fallback_analysis(self, finding: dict, error: str) -> dict:
        """Fallback when AI call fails — conservative manual review verdict."""
        return {
            "verdict": "Needs Manual Verification",
            "severity_classified": finding.get("scanner_severity", "Medium"),
            "priority_recommendation": "Normal",
            "priority_reason": "AI analysis was unavailable. Manual security review required.",
            "confidence_reason": f"AI engine error: {error[:200]}. Raw scanner evidence requires human evaluation.",
            "root_cause": "Automated AI analysis failed — refer to raw evidence for details.",
            "developer_explanation": (
                "The automated AI analysis engine was unable to process this finding. "
                "Please review the raw evidence manually with a security professional."
            ),
            "fix_recommendation": "Conduct manual security review of the identified endpoint.",
            "remediation_code": {
                "language": "N/A",
                "secure_code_example": "# Manual review required — AI analysis unavailable",
            },
            "manual_verification_guide": "1. Review raw evidence manually.\n2. Test endpoint with Burp Suite.\n3. Consult OWASP testing guide.",
        }
