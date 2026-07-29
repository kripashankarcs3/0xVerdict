# 0xVerdict

0xVerdict is an AI-powered web vulnerability scanner that turns raw scan output into developer-friendly security intelligence.

It combines a React dashboard for the UI, a FastAPI backend for scan orchestration, and AI-assisted analysis for verdicts, remediation guidance, and reporting.

## Highlights

- AI-assisted verdicts for scan findings
- Root-cause explanations and fix guidance
- Markdown and PDF report generation
- Scan history and results review
- Cyberpunk-style security dashboard

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4
- Backend: Python 3.12, FastAPI, Pydantic
- AI: OpenRouter-compatible analysis pipeline
- Reports: Markdown, WeasyPrint, ReportLab
- Deployment: Docker and Docker Compose

## Repository Layout

```text
0xVerdict/
+-- frontend/                      # Active React + Vite app
|   +-- src/                       # UI source code
+-- services/
|   +-- 0xverdict-take-idea/
|       +-- backend/               # FastAPI scanner service
|       +-- frontend/              # Service-side frontend snapshot
+-- docs/                          # Additional documentation
+-- legacy/                        # Archived snapshots and older iterations
+-- package.json                   # Root scripts for the active frontend
+-- README.md                      # Project overview
```

## Run Locally

### Frontend

```bash
pnpm install
pnpm run dev
```

This starts the active Vite app from `frontend/` and serves it on `http://localhost:8443`.

### Backend

```bash
cd services/0xverdict-take-idea/backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Project Notes

- The active UI lives in `frontend/`.
- The backend service lives in `services/0xverdict-take-idea/backend/`.
- `legacy/` and the top-level `0xverdict-take-idea/` folder are kept as migration-era folders and should be treated as historical unless you explicitly decide to consolidate them.
- Generated folders such as `dist/`, `node_modules/`, `venv/`, and `__pycache__/` are already ignored.

## Safe Testing

Only scan targets you own or are explicitly authorized to test.

Examples of safe lab targets:

- OWASP Juice Shop
- DVWA
- Vulnweb test environments

## Status

The codebase is in a good place for a public demo, but the repository still contains migration-era folders. If you want the strongest GitHub impression, the next step would be a cleanup pass that consolidates the active frontend and backend into one clearly documented release structure.
