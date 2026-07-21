# 🛡️ 0xVerdict — AI Bug Hunting Assistant

> Transforming raw vulnerability scanner output into developer-ready security intelligence using AI.

## Architecture Overview

```
User
 │
 ▼
React Frontend (0xVerdict UI)
 │  ← REST API calls
 ▼
FastAPI Backend
 ├── Recon Engine      (Member 1 — crawler, header analysis)
 ├── Detection Engine  (Member 1 — SQLi, XSS, header scanners)
 ├── AI Orchestrator   (Member 2 — Claude Sonnet via Anthropic API)
 └── Reporting Engine  (Member 3 — Markdown + PDF export)
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start the API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm install                    # or pnpm install
npm run dev                    # starts on port 8443 (matches vite.config.ts)
```

### 3. Docker (Full Stack)

```bash
# From project root
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- API Docs: http://localhost:8000/docs

## Safe Test Targets

| Target | URL |
|--------|-----|
| Vulnweb (intentionally vulnerable) | http://testphp.vulnweb.com |
| DVWA (local) | http://localhost/dvwa |
| OWASP Juice Shop (local Docker) | http://localhost:3000 |

> ⚠️ **Never scan targets without explicit written authorization.**

## Project Structure

```
0xverdict/
├── backend/
│   ├── main.py                 # FastAPI app + pipeline orchestration
│   ├── models.py               # Pydantic data schemas (shared contract)
│   ├── state_manager.py        # In-memory scan state tracker
│   ├── engines/
│   │   ├── recon.py            # Crawler + header analyzer (Member 1)
│   │   ├── detection.py        # SQLi + XSS + Header scanners (Member 1)
│   │   ├── ai_orchestrator.py  # Claude AI analysis engine (Member 2)
│   │   └── reporter.py         # MD + PDF report generator (Member 3)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   └── src/
│       ├── App.tsx             # App shell + navigation
│       ├── pages/
│       │   ├── Dashboard.tsx   # Main scan interface
│       │   ├── ScanResults.tsx # Results viewer
│       │   └── ScanHistory.tsx # Past scans list
│       ├── components/
│       │   ├── ScanProgress.tsx  # Live pipeline status
│       │   ├── MetricsBar.tsx    # Severity + verdict counts
│       │   ├── ReconPanel.tsx    # Crawl results display
│       │   ├── FindingsTable.tsx # Master vulnerability table
│       │   └── FindingDetail.tsx # Drill-down with AI analysis
│       ├── hooks/useScan.ts    # Polling hook
│       ├── utils/api.ts        # API client
│       └── types/index.ts      # Shared TypeScript types
│
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan/start` | Start a new scan |
| GET | `/scan/{id}/status` | Poll scan progress |
| GET | `/scan/{id}/result` | Get full results |
| GET | `/scan/{id}/report/markdown` | Download .md report |
| GET | `/scan/{id}/report/pdf` | Download PDF report |
| GET | `/scans` | List all past scans |

## Shared JSON Contract

All three engines communicate through this schema (defined in `models.py`):

```json
{
  "scan_id": "uuid",
  "target_url": "http://...",
  "scan_status": "Completed",
  "scan_duration": "45 sec",
  "summary": { "total_findings": 3, "confirmed": 2, ... },
  "recon_data": { "pages_found": [...], "forms_found": [...], ... },
  "findings": [{
    "id": "vuln_abc123",
    "type": "SQL Injection",
    "endpoint": "/login",
    "payload": "' OR 1=1--",
    "raw_evidence": "MySQL syntax error...",
    "scanner_severity": "High",
    "ai_analysis": {
      "verdict": "Confirmed",
      "severity_classified": "Critical",
      "priority_recommendation": "Immediate",
      "root_cause": "...",
      "fix_recommendation": "...",
      "remediation_code": { "language": "Node.js", "secure_code_example": "..." },
      "manual_verification_guide": "1. Open DevTools..."
    }
  }]
}
```

## Team Member Integration Guide

### Member 1 (Recon & Detection)
- Edit `backend/engines/recon.py` — add new crawl strategies
- Edit `backend/engines/detection.py` — add new payload lists or scanner modules
- Output must match the `Finding` schema in `models.py`

### Member 2 (AI Orchestration)
- Edit `backend/engines/ai_orchestrator.py`
- Tune `SYSTEM_PROMPT` and `ANALYSIS_SCHEMA` for better AI verdicts
- Add Pydantic validation in `_call_claude()` for schema enforcement

### Member 3 (Dashboard & Reporting)
- Edit `backend/engines/reporter.py` for PDF/MD improvements
- Edit `frontend/src/pages/Dashboard.tsx` for UI changes
- Edit `frontend/src/components/FindingsTable.tsx` for table improvements

## Legal Disclaimer

**NOTICE:** This tool is intended exclusively for authorized security testing environments (e.g., OWASP Juice Shop, DVWA, or target infrastructure where explicit, written permission has been granted). Unauthorized scanning of external networks violates global cyber defense frameworks and local regulations. The authors assume no liability for misuse.
