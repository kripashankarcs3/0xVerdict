"""
0xVerdict Backend — AI Bug Hunting Assistant
FastAPI server orchestrating Recon, Detection, and AI Analysis engines.
"""

import os
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import uvicorn
import uuid
import json
from datetime import datetime
from pathlib import Path

from models import ScanRequest, ScanResult, ScanStatus
from engines.recon import ReconEngine
from engines.detection import DetectionEngine
from engines.ai_orchestrator import AIOrchestrator, OPENROUTER_API_KEY, OPENROUTER_MODEL
from engines.reporter import ReportingEngine
from state_manager import ScanStateManager

app = FastAPI(
    title="0xVerdict API",
    description="AI-Powered Web Vulnerability Analysis Engine",
    version="1.0.0"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins
    else ["http://localhost:3000", "http://localhost:8443"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

state_manager = ScanStateManager()


@app.get("/")
async def root():
    return {"message": "0xVerdict API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check — no rate limiting applied."""
    # PDF availability check
    pdf_method = "none"
    try:
        import weasyprint  # noqa: F401
        pdf_method = "weasyprint"
    except ImportError:
        try:
            import reportlab  # noqa: F401
            pdf_method = "reportlab"
        except ImportError:
            pass

    all_states = state_manager.list_scans()
    active = sum(1 for s in all_states if s["scan_status"] not in ("Completed", "Failed"))

    return {
        "status": "healthy",
        "version": "1.0.0",
        "ai_provider": "openrouter",
        "ai_model": OPENROUTER_MODEL,
        "ai_api": "configured" if OPENROUTER_API_KEY else "not configured",
        "active_scans": active,
        "total_scans": len(all_states),
        "pdf_generation": pdf_method != "none",
        "pdf_method": pdf_method,
    }


@app.post("/scan/start")
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Initiate a new vulnerability scan."""
    scan_id = str(uuid.uuid4())
    state_manager.init_scan(scan_id, request.target_url)
    background_tasks.add_task(run_scan_pipeline, scan_id, request.target_url)
    return {"scan_id": scan_id, "status": "initiated", "target_url": request.target_url}


@app.get("/scan/{scan_id}/status")
async def get_scan_status(scan_id: str):
    """Poll the current status of a scan."""
    state = state_manager.get_state(scan_id)
    if not state:
        return {"error": "Scan not found"}
    return state


@app.get("/scan/{scan_id}/result")
async def get_scan_result(scan_id: str):
    """Get the full result of a completed scan."""
    state = state_manager.get_state(scan_id)
    if not state:
        return {"error": "Scan not found"}
    return state


@app.get("/scan/{scan_id}/report/markdown")
async def download_markdown_report(scan_id: str):
    """Download the vulnerability report as Markdown."""
    state = state_manager.get_state(scan_id)
    if not state or state.get("scan_status") != "Completed":
        return {"error": "Scan not complete or not found"}
    reporter = ReportingEngine(state)
    md_content = reporter.generate_markdown()
    return StreamingResponse(
        iter([md_content]),
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=0xverdict-report-{scan_id[:8]}.md"}
    )


@app.get("/scan/{scan_id}/report/pdf")
async def download_pdf_report(scan_id: str):
    """Download the vulnerability report as PDF."""
    state = state_manager.get_state(scan_id)
    if not state or state.get("scan_status") != "Completed":
        return {"error": "Scan not complete or not found"}
    reporter = ReportingEngine(state)
    pdf_path = reporter.generate_pdf(scan_id)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"0xverdict-report-{scan_id[:8]}.pdf"
    )


@app.get("/scans")
async def list_scans():
    """List all scans."""
    return state_manager.list_scans()


async def run_scan_pipeline(scan_id: str, target_url: str):
    """Full scan pipeline: Recon → Detection → AI Analysis."""
    try:
        start_time = datetime.now()

        # --- PHASE 1: RECON ---
        state_manager.update_status(scan_id, "Reconnoitering", "Crawling target domain...")
        recon = ReconEngine(target_url)
        recon_data = await recon.run()
        state_manager.update_recon(scan_id, recon_data)

        # --- PHASE 2: DETECTION ---
        state_manager.update_status(scan_id, "Scanning", "Running vulnerability detectors...")
        detector = DetectionEngine(target_url, recon_data)
        raw_findings = await detector.run()
        state_manager.update_raw_findings(scan_id, raw_findings)

        # --- PHASE 3: AI ANALYSIS ---
        state_manager.update_status(scan_id, "AI Analyzing", "AI is analyzing findings...")
        ai_engine = AIOrchestrator()
        analyzed_findings = await ai_engine.analyze_all(raw_findings)

        # --- FINALIZE ---
        elapsed = (datetime.now() - start_time).seconds
        state_manager.finalize_scan(scan_id, analyzed_findings, elapsed)

    except Exception as e:
        state_manager.mark_failed(scan_id, str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
