<p align="center">
  <img src="frontend/src/assets/final_logo.png" alt="0xVerdict" width="150" height="150">
</p>

<h1 align="center">0xVerdict</h1>

<p align="center">
  <b>AI-Powered Web Vulnerability Scanner</b>
</p>

0xVerdict is an AI-powered web vulnerability scanner that turns raw scan output into developer-friendly security intelligence. It combines a React dashboard for the UI, a FastAPI backend for scan orchestration, and AI-assisted analysis for verdicts, remediation guidance, and reporting.

## Highlights

- AI-assisted verdicts for scan findings
- Root-cause explanations and fix guidance
- Markdown and PDF report generation
- Scan history and results review
- Cyberpunk-style security dashboard

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Python 3.12, FastAPI, Pydantic
- **AI**: OpenRouter-compatible analysis pipeline
- **Reports**: Markdown, WeasyPrint, ReportLab

## Structure

```
0xVerdict/
├── frontend/     React + Vite + Tailwind CSS (port 8443)
├── backend/      FastAPI Python backend (port 5432)
├── .env          Environment variables
├── package.json  Root scripts (dev, build)
└── README.md
```

## Development

### Frontend
```bash
npm run dev    # starts Vite on port 8443
```

### Backend
```bash
cd backend
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5432 --reload
```

## Deployment

- Frontend: Vercel (root: `frontend/`)
- Backend: Render Web Service (root: `backend/`)

## Safe Testing

Only scan targets you own or are explicitly authorized to test.

Examples of safe lab targets:
- OWASP Juice Shop
- DVWA
- Vulnweb test environments
