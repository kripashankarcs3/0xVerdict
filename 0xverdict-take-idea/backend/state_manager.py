"""
0xVerdict — Scan State Manager
In-memory store tracking each scan through its lifecycle stages.
Persists scan state to disk so history survives server restarts.
"""

from datetime import datetime
from typing import Optional
from pathlib import Path
import threading
import json
import os

SCANS_DIR = Path(os.environ.get("SCAN_DATA_DIR", "./scan_data"))


class ScanStateManager:
    def __init__(self):
        self._store: dict = {}
        self._lock = threading.Lock()
        SCANS_DIR.mkdir(exist_ok=True)
        self._load_from_disk()

    def _load_from_disk(self):
        """Load all persisted scan JSON files into memory on startup."""
        for f in SCANS_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                self._store[data["scan_id"]] = data
            except Exception:
                pass  # Skip corrupted files silently

    def _save_to_disk(self, scan_id: str):
        """Persist a single scan state to SCANS_DIR/{scan_id}.json."""
        try:
            state = self._store.get(scan_id)
            if state:
                path = SCANS_DIR / f"{scan_id}.json"
                path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass  # Never crash the scan pipeline over a disk write

    def init_scan(self, scan_id: str, target_url: str):
        with self._lock:
            self._store[scan_id] = {
                "scan_id": scan_id,
                "target_url": target_url,
                "scan_date": datetime.now().strftime("%Y-%m-%d"),
                "scan_status": "Initiated",
                "pipeline_message": "Scan queued...",
                "scan_duration": "0 sec",
                "progress_percent": 0,
                "summary": {
                    "total_findings": 0,
                    "confirmed": 0,
                    "needs_verification": 0,
                    "false_positives": 0,
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0,
                },
                "recon_data": None,
                "findings": [],
            }

    def get_state(self, scan_id: str) -> Optional[dict]:
        return self._store.get(scan_id)

    def list_scans(self) -> list:
        return [
            {
                "scan_id": v["scan_id"],
                "target_url": v["target_url"],
                "scan_date": v["scan_date"],
                "scan_status": v["scan_status"],
                "summary": v["summary"],
            }
            for v in self._store.values()
        ]

    def update_status(self, scan_id: str, status: str, message: str, percent: int = 0):
        with self._lock:
            if scan_id in self._store:
                self._store[scan_id]["scan_status"] = status
                self._store[scan_id]["pipeline_message"] = message
                self._store[scan_id]["progress_percent"] = percent

    def update_recon(self, scan_id: str, recon_data: dict):
        with self._lock:
            if scan_id in self._store:
                self._store[scan_id]["recon_data"] = recon_data
                self._store[scan_id]["progress_percent"] = 30
                self._store[scan_id]["pipeline_message"] = (
                    f"Recon complete. Found {len(recon_data.get('pages_found', []))} pages, "
                    f"{len(recon_data.get('forms_found', []))} forms."
                )

    def update_raw_findings(self, scan_id: str, raw_findings: list):
        with self._lock:
            if scan_id in self._store:
                self._store[scan_id]["findings"] = raw_findings
                self._store[scan_id]["progress_percent"] = 60
                self._store[scan_id]["pipeline_message"] = (
                    f"Detection complete. {len(raw_findings)} raw findings queued for AI analysis."
                )

    def finalize_scan(self, scan_id: str, analyzed_findings: list, elapsed_seconds: int):
        with self._lock:
            if scan_id not in self._store:
                return

            confirmed = sum(
                1 for f in analyzed_findings
                if f.get("ai_analysis", {}).get("verdict") == "Confirmed"
            )
            needs_verify = sum(
                1 for f in analyzed_findings
                if f.get("ai_analysis", {}).get("verdict") == "Needs Manual Verification"
            )
            false_pos = sum(
                1 for f in analyzed_findings
                if f.get("ai_analysis", {}).get("verdict") == "Likely False Positive"
            )

            severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
            for f in analyzed_findings:
                sev = f.get("ai_analysis", {}).get("severity_classified", "Info").lower()
                if sev in severity_counts:
                    severity_counts[sev] += 1

            self._store[scan_id].update({
                "scan_status": "Completed",
                "pipeline_message": "Scan complete. AI analysis finished.",
                "scan_duration": f"{elapsed_seconds} sec",
                "progress_percent": 100,
                "findings": analyzed_findings,
                "summary": {
                    "total_findings": len(analyzed_findings),
                    "confirmed": confirmed,
                    "needs_verification": needs_verify,
                    "false_positives": false_pos,
                    **severity_counts,
                },
            })
        self._save_to_disk(scan_id)

    def mark_failed(self, scan_id: str, error: str):
        with self._lock:
            if scan_id in self._store:
                self._store[scan_id]["scan_status"] = "Failed"
                self._store[scan_id]["pipeline_message"] = f"Error: {error}"
        self._save_to_disk(scan_id)
