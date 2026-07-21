"""
0xVerdict — Reporting & Dashboard Engine (Member 3: Task 3.3)
Generates Markdown and PDF vulnerability reports from scan state.
"""

import os
import re
import tempfile
from datetime import datetime
from pathlib import Path


LEGAL_DISCLAIMER = """
---
## ⚠️ Legal Disclaimer

**NOTICE:** This tool is intended exclusively for authorized security testing environments
(e.g., OWASP Juice Shop, DVWA, or target infrastructure where explicit, written permission
has been granted). Unauthorized scanning of external networks violates global cyber defense
frameworks and local regulations. The authors assume no liability for misuse.
""".strip()


class ReportingEngine:
    def __init__(self, scan_state: dict):
        self.state = scan_state
        self.target = scan_state.get("target_url", "Unknown Target")
        self.scan_date = scan_state.get("scan_date", datetime.now().strftime("%Y-%m-%d"))
        self.duration = scan_state.get("scan_duration", "N/A")
        self.summary = scan_state.get("summary", {})
        self.findings = scan_state.get("findings", [])
        self.recon = scan_state.get("recon_data", {})

    # ─── Markdown Generator ───────────────────────────────────────────────────
    def generate_markdown(self) -> str:
        sections = [
            self._md_cover(),
            self._md_executive_summary(),
            self._md_recon_summary(),
            self._md_findings_table(),
            self._md_findings_detail(),
            LEGAL_DISCLAIMER,
        ]
        return "\n\n".join(sections)

    def _md_cover(self) -> str:
        return f"""# 🛡️ 0xVerdict Security Assessment Report

**Target:** `{self.target}`
**Scan Date:** {self.scan_date}
**Scan Duration:** {self.duration}
**Report Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
**Tool Version:** 0xVerdict v1.0.0"""

    def _md_executive_summary(self) -> str:
        s = self.summary
        total = s.get("total_findings", 0)
        confirmed = s.get("confirmed", 0)
        verify = s.get("needs_verification", 0)
        fp = s.get("false_positives", 0)

        lines = [
            "## 📊 Executive Summary",
            "",
            f"A total of **{total} potential security findings** were identified during this assessment.",
            "",
            "### Verdict Breakdown",
            f"| Status | Count |",
            f"|--------|-------|",
            f"| ✅ Confirmed | {confirmed} |",
            f"| 🔍 Needs Manual Verification | {verify} |",
            f"| ❌ Likely False Positive | {fp} |",
            "",
            "### Severity Distribution",
            "| Severity | Count |",
            "|----------|-------|",
            f"| 🔴 Critical | {s.get('critical', 0)} |",
            f"| 🟠 High | {s.get('high', 0)} |",
            f"| 🟡 Medium | {s.get('medium', 0)} |",
            f"| 🟢 Low | {s.get('low', 0)} |",
            f"| ℹ️ Info | {s.get('info', 0)} |",
        ]
        return "\n".join(lines)

    def _md_recon_summary(self) -> str:
        if not self.recon:
            return "## 🔍 Reconnaissance\n\nNo reconnaissance data available."

        pages = self.recon.get("pages_found", [])
        forms = self.recon.get("forms_found", [])
        missing = self.recon.get("missing_headers", [])

        lines = [
            "## 🔍 Reconnaissance Summary",
            "",
            f"- **Pages Crawled:** {len(pages)}",
            f"- **Forms Discovered:** {len(forms)}",
            f"- **Missing Security Headers:** {len(missing)}",
            "",
        ]
        if missing:
            lines.append("### Missing Headers")
            for h in missing:
                lines.append(f"- `{h}`")

        return "\n".join(lines)

    def _md_findings_table(self) -> str:
        if not self.findings:
            return "## 📋 Findings Summary\n\nNo findings detected."

        lines = [
            "## 📋 Findings Summary",
            "",
            "| # | Finding | Type | Verdict | AI Severity | Priority |",
            "|---|---------|------|---------|-------------|----------|",
        ]
        for i, f in enumerate(self.findings, 1):
            ai = f.get("ai_analysis", {})
            verdict = ai.get("verdict", "Pending")
            sev = ai.get("severity_classified", f.get("scanner_severity", "?"))
            priority = ai.get("priority_recommendation", "?")
            verdict_icon = {"Confirmed": "✅", "Needs Manual Verification": "🔍",
                           "Likely False Positive": "❌"}.get(verdict, "❓")
            lines.append(
                f"| {i} | `{f.get('endpoint', 'N/A')}` | {f.get('type', 'N/A')} "
                f"| {verdict_icon} {verdict} | {sev} | {priority} |"
            )
        return "\n".join(lines)

    def _md_findings_detail(self) -> str:
        if not self.findings:
            return ""
        sections = ["## 🔬 Detailed Findings"]
        for i, f in enumerate(self.findings, 1):
            ai = f.get("ai_analysis", {})
            remed = ai.get("remediation_code", {})
            lang = remed.get("language", "bash")
            code = remed.get("secure_code_example", "")
            guide = ai.get("manual_verification_guide", "")

            sections.append(f"""
### Finding #{i}: {f.get("type", "Unknown")}

**Endpoint:** `{f.get("endpoint", "N/A")}`
**Payload Used:** `{f.get("payload", "N/A")}`
**Scanner Severity:** {f.get("scanner_severity", "?")}

#### 🤖 AI Verdict
- **Verdict:** {ai.get("verdict", "N/A")}
- **AI Severity:** {ai.get("severity_classified", "N/A")}
- **Priority:** {ai.get("priority_recommendation", "N/A")}

#### 📌 Evidence
```
{f.get("raw_evidence", "No evidence")}
```

#### 🧠 AI Analysis
**Root Cause:** {ai.get("root_cause", "N/A")}

**Developer Explanation:** {ai.get("developer_explanation", "N/A")}

**Confidence:** {ai.get("confidence_reason", "N/A")}

**Priority Justification:** {ai.get("priority_reason", "N/A")}

#### 🛠️ Remediation
{ai.get("fix_recommendation", "N/A")}

```{lang.lower().replace(" ", "-").replace("/", "-")}
{code}
```

#### 🧪 Manual Verification Steps
{guide}
""")
        return "\n".join(sections)

    # ─── PDF Generator ────────────────────────────────────────────────────────
    def generate_pdf(self, scan_id: str) -> str:
        """Convert Markdown to PDF using weasyprint or reportlab fallback."""
        md_content = self.generate_markdown()

        # Try weasyprint (best quality)
        try:
            return self._generate_pdf_weasyprint(md_content, scan_id)
        except ImportError:
            pass

        # Fallback to reportlab
        try:
            return self._generate_pdf_reportlab(scan_id)
        except ImportError:
            pass

        # Last resort: save as plain text PDF placeholder
        output_path = f"/tmp/0xverdict-{scan_id[:8]}.txt"
        with open(output_path, "w") as f:
            f.write(md_content)
        return output_path

    def _generate_pdf_weasyprint(self, md_content: str, scan_id: str) -> str:
        import markdown
        from weasyprint import HTML, CSS

        html_body = markdown.markdown(
            md_content,
            extensions=["tables", "fenced_code", "codehilite"]
        )
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Helvetica', sans-serif; margin: 40px; color: #1a1a2e; }}
            h1 {{ color: #0f3460; border-bottom: 3px solid #16213e; padding-bottom: 10px; }}
            h2 {{ color: #16213e; border-bottom: 1px solid #e94560; }}
            h3 {{ color: #e94560; }}
            code {{ background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; }}
            pre {{ background: #1a1a2e; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }}
            pre code {{ background: none; color: inherit; }}
            table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
            th {{ background: #16213e; color: white; padding: 8px 12px; text-align: left; }}
            td {{ border: 1px solid #ddd; padding: 8px 12px; }}
            tr:nth-child(even) {{ background: #f8f9fa; }}
            .cover {{ text-align: center; padding: 80px 0; }}
            blockquote {{ border-left: 4px solid #e94560; padding-left: 16px; color: #666; }}
        </style>
        </head>
        <body>{html_body}</body>
        </html>
        """
        output_path = f"/tmp/0xverdict-{scan_id[:8]}.pdf"
        HTML(string=full_html).write_pdf(output_path)
        return output_path

    def _generate_pdf_reportlab(self, scan_id: str) -> str:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        )

        output_path = f"/tmp/0xverdict-{scan_id[:8]}.pdf"
        doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=0.75*inch)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle("title", parent=styles["Title"],
                                     textColor=colors.HexColor("#0f3460"), fontSize=24)
        story.append(Paragraph("0xVerdict Security Report", title_style))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"Target: {self.target}", styles["Normal"]))
        story.append(Paragraph(f"Date: {self.scan_date} | Duration: {self.duration}", styles["Normal"]))
        story.append(PageBreak())

        # Summary table
        h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=colors.HexColor("#16213e"))
        story.append(Paragraph("Executive Summary", h2))
        s = self.summary
        data = [
            ["Metric", "Value"],
            ["Total Findings", str(s.get("total_findings", 0))],
            ["Confirmed", str(s.get("confirmed", 0))],
            ["Needs Verification", str(s.get("needs_verification", 0))],
            ["False Positives", str(s.get("false_positives", 0))],
            ["Critical", str(s.get("critical", 0))],
            ["High", str(s.get("high", 0))],
            ["Medium", str(s.get("medium", 0))],
            ["Low", str(s.get("low", 0))],
        ]
        t = Table(data, colWidths=[3*inch, 3*inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.3*inch))

        # Findings
        for i, f in enumerate(self.findings, 1):
            ai = f.get("ai_analysis", {})
            story.append(Paragraph(f"Finding #{i}: {f.get('type')}", h2))
            story.append(Paragraph(f"<b>Endpoint:</b> {f.get('endpoint', 'N/A')}", styles["Normal"]))
            story.append(Paragraph(f"<b>Verdict:</b> {ai.get('verdict', 'N/A')}", styles["Normal"]))
            story.append(Paragraph(f"<b>Severity:</b> {ai.get('severity_classified', 'N/A')}", styles["Normal"]))
            story.append(Paragraph(f"<b>Fix:</b> {ai.get('fix_recommendation', 'N/A')}", styles["Normal"]))
            story.append(Spacer(1, 0.2*inch))

        # Disclaimer
        story.append(PageBreak())
        story.append(Paragraph("Legal Disclaimer", h2))
        story.append(Paragraph(
            "NOTICE: This tool is intended exclusively for authorized security testing environments. "
            "Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.",
            styles["Normal"]
        ))

        doc.build(story)
        return output_path
