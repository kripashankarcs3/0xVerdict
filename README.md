<p align="center">
  <img src="frontend/src/assets/final_logo.png" alt="0xVerdict" width="150" height="150">
</p>

<h1 align="center">0xVerdict</h1>

<p align="center">
  <b>AI-Powered Web Vulnerability Scanner</b>
  <br>
  <a href="https://0x-verdict.vercel.app/">Live Demo</a>
  ·
  <a href="https://github.com/kripashankarcs3/0xVerdict">GitHub</a>
</p>

<p align="center">
  <i>From recon to report — automated web security analysis with AI-driven verdicts.</i>
</p>

---

## Overview

0xVerdict is a full-stack web vulnerability scanner that automates the entire security testing pipeline. Enter a target URL, and the tool crawls the domain, detects vulnerabilities, sends findings to an AI engine for analysis, and generates a professional report — all in one seamless workflow.

Built for **bug bounty hunters**, **security engineers**, and **developers** who need fast, accurate vulnerability analysis without the noise of traditional scanners.

---

## Architecture

```
User Input (Target URL)
        │
        ▼
┌─────────────────────────────────────────────────┐
│               Scan Pipeline                      │
│                                                   │
│   Recon ──► Detection ──► AI Analysis ──► Report │
│                                                   │
│   ①         ②               ③              ④    │
└─────────────────────────────────────────────────┘
        │
        ▼
  Dashboard (Real-time updates via polling)
```

The pipeline runs asynchronously in four phases:

| Phase | Component | What It Does |
|---|---|---|
| **① Recon** | `ReconEngine` | Crawls the target domain, discovers URLs, extracts forms, scripts, tech stack, and entry points |
| **② Detection** | `DetectionEngine` | Tests each entry point for OWASP Top 10 vulnerabilities — XSS, SQLi, SSRF, LFI, Path Traversal, Open Redirect, and more |
| **③ AI Analysis** | `AIOrchestrator` | Sends raw findings to OpenRouter (DeepSeek), which returns verdicts (Critical/High/Medium/Low/Info), root-cause explanations, and remediation steps |
| **④ Report** | `ReportingEngine` | Generates downloadable Markdown and PDF reports with findings, severity scores, and fix guidance |

---

## Features

### 🔍 Recon Engine
- Async web crawling with configurable depth and page limits
- Extracts all URLs, forms, input fields, scripts, and external resources
- Identifies tech stack (frameworks, libraries, server headers)
- Discovers entry points for vulnerability testing

### 🚨 Detection Engine
- Tests each discovered entry point against multiple attack vectors
- Vulnerability checks:
  - **XSS** (Reflected, Stored, DOM-based)
  - **SQL Injection** (Error-based, Boolean-based, Time-based)
  - **SSRF** (Server-Side Request Forgery)
  - **LFI** (Local File Inclusion)
  - **Path Traversal**
  - **Open Redirect**
  - **Command Injection**
- Payload-based testing with response analysis
- Deduplication and correlation of findings

### 🤖 AI Analysis (OpenRouter)
- Each finding is sent to the AI engine for deep analysis
- Returns:
  - **Severity verdict** (Critical / High / Medium / Low / Info)
  - **CVSS-style risk score**
  - **Root-cause explanation**
  - **Remediation steps** with code examples
  - **Attack scenario description**
- Batch processing for efficiency
- Fallback handling for API errors

### 💬 AI Security Chat
- Streaming SSE-based chat endpoint
- Ask follow-up questions about vulnerabilities
- Context-aware responses using the same AI model
- Non-streaming fallback available

### 📄 Report Generation
- **Markdown reports** — clean, readable format with full findings
- **PDF reports** — professional-grade output via WeasyPrint or ReportLab
- Includes: target info, scan summary, finding details, risk scores, and fix guidance
- Downloadable via REST API endpoints

### 📊 Dashboard
- Cyberpunk-styled UI with real-time scan progress
- Scan history with status tracking
- Detailed results view with per-finding analysis
- Interactive charts and metrics
- PDF preview and download modal

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Component-based UI |
| **Build** | Vite 8 | Fast dev server & optimized builds |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive design |
| **Backend** | Python 3.12 + FastAPI | Async REST API |
| **Validation** | Pydantic v2 | Request/response validation |
| **AI** | OpenRouter (DeepSeek V4) | Vulnerability analysis & chat |
| **HTTP** | aiohttp / httpx | Async crawling & API calls |
| **PDF** | WeasyPrint + ReportLab | Report generation |


---

## Project Structure

```
0xVerdict/
├── frontend/                    React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── assets/              Static assets (logo, images)
│   │   ├── components/          Reusable UI components
│   │   │   ├── AIChat.tsx       AI security chat interface
│   │   │   ├── AIPanel.tsx      AI analysis panel
│   │   │   ├── ApiHub.tsx       API configuration hub
│   │   │   ├── History.tsx      Scan history list
│   │   │   ├── Landing.tsx      Landing/hero page
│   │   │   ├── Navbar.tsx       Navigation bar with logo
│   │   │   ├── PdfModal.tsx     PDF report preview modal
│   │   │   ├── Results.tsx      Scan results display
│   │   │   ├── Scanning.tsx     Real-time scan progress
│   │   │   └── Threats.tsx      Threat overview
│   │   ├── hooks/               Custom React hooks
│   │   ├── types/               TypeScript type definitions
│   │   ├── utils/               Utility functions & API client
│   │   ├── App.tsx              Root component with routing
│   │   ├── main.tsx             Entry point
│   │   └── index.css            Global styles + Tailwind
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     FastAPI Python backend
│   ├── main.py                  App entry point, routes, CORS
│   ├── models.py                Pydantic models
│   ├── state_manager.py         Scan state management
│   ├── engines/
│   │   ├── recon.py             Async web crawler & recon
│   │   ├── detection.py         Vulnerability detection engine
│   │   ├── ai_orchestrator.py   AI analysis & chat
│   │   └── reporter.py          Markdown & PDF report gen
│   ├── scan_data/               Scan result storage (gitignored)
│   ├── .env.example             Environment template
│   ├── requirements.txt
│   └── Dockerfile
│
├── .env                         Environment variables (gitignored)
├── .gitignore
├── package.json                 Root scripts (dev, build)
├── pnpm-lock.yaml
├── AGENTS.md                    Dev agent instructions
└── README.md
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+ & **npm** (or pnpm)
- **Python** 3.12+
- **OpenRouter API key** (for AI features)

### Frontend

```bash
# Install dependencies & start dev server
npm run dev
# → http://localhost:8443
```

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\Activate.ps1

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5432 --reload
# → http://localhost:5432
```



## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root health check |
| `GET` | `/health` | Detailed status with AI config & active scans |
| `POST` | `/scan/start` | Initiate a new scan |
| `GET` | `/scan/{id}/status` | Poll scan progress |
| `GET` | `/scan/{id}/result` | Get full scan results |
| `GET` | `/scans` | List all scans |
| `GET` | `/scan/{id}/report/markdown` | Download Markdown report |
| `GET` | `/scan/{id}/report/pdf` | Download PDF report |
| `POST` | `/chat` | AI security chat (non-streaming) |
| `POST` | `/chat/stream` | AI security chat (SSE streaming) |

---

## Safe Testing

Only scan targets you own or are explicitly authorized to test.

**Recommended test targets:**
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [DVWA](http://www.dvwa.co.uk/)
- [Vulnweb](http://testphp.vulnweb.com/)
- [HackTheBox](https://www.hackthebox.com/)

---

## License

MIT
