 # 0xVerdict — Complete OpenCode Agent Guide
### *Apne AI Coding Agent (OpenCode) ko prompt deke project industry-level banana ka full playbook*

> **Ye document kiske liye hai?**
> Tere paas 0xVerdict ka poora codebase hai. Tu khud code nahi likhega — terminal mein OpenCode open karega, use carefully crafted prompts dega, output verify karega, aur agar galat ho toh corrective prompt dega. Ye guide teri har step mein madad karega.

---

## Table of Contents

1. [Project Ka Overview](#1-project-ka-overview)
2. [Folder Structure Samjho](#2-folder-structure-samjho)
3. [OpenCode Setup — Pehli Baar](#3-opencode-setup--pehli-baar)
4. [Verify Kaise Karte Hain — Rule #1](#4-verify-kaise-karte-hain--rule-1)
5. [Backend Improvements — Prompts + Verify Steps](#5-backend-improvements--prompts--verify-steps)
6. [Frontend Improvements — Prompts + Verify Steps](#6-frontend-improvements--prompts--verify-steps)
7. [New Features Add Karna](#7-new-features-add-karna)
8. [Bug Fix Karna](#8-bug-fix-karna)
9. [Galat Output Aaya — Corrective Prompts](#9-galat-output-aaya--corrective-prompts)
10. [Production Ready Banana](#10-production-ready-banana)
11. [Common Mistakes aur Unse Bachna](#11-common-mistakes-aur-unse-bachna)
12. [Quick Reference Card](#12-quick-reference-card)

---

## 1. Project Ka Overview

```
User Browser
     │
     ▼
React Frontend (Vite + Tailwind v4)   ← port 8443 (dev) / 3000 (Docker)
     │  REST API calls
     ▼
FastAPI Backend (Python 3.12)          ← port 8000
     │
     ├── ReconEngine      → target website crawl karta hai
     ├── DetectionEngine  → SQLi / XSS / Header vulnerabilities dhundta hai
     ├── AIOrchestrator   → Claude AI se har finding analyze karta hai
     └── ReportingEngine  → Markdown + PDF report generate karta hai
```

**Tech Stack:**
- Frontend: React 19, TypeScript, Vite 8, Tailwind CSS v4
- Backend: FastAPI, Python 3.12, aiohttp (async HTTP), Anthropic SDK
- AI: Claude Sonnet (claude-sonnet-4-6)
- Deploy: Docker + Docker Compose

**Shared Data Contract** — teeno engines is JSON schema se communicate karte hain:
```json
{
  "scan_id": "uuid",
  "target_url": "http://...",
  "scan_status": "Completed",
  "summary": { "total_findings": 3, "confirmed": 2, ... },
  "recon_data": { "pages_found": [...], "forms_found": [...] },
  "findings": [{
    "id": "vuln_001",
    "type": "SQL Injection",
    "endpoint": "/login",
    "payload": "' OR 1=1--",
    "raw_evidence": "MySQL error...",
    "scanner_severity": "High",
    "ai_analysis": {
      "verdict": "Confirmed",
      "severity_classified": "Critical",
      "remediation_code": { "language": "Node.js", "secure_code_example": "..." }
    }
  }]
}
```

---

## 2. Folder Structure Samjho

```
0xverdict/
│
├── backend/                          ← Python FastAPI server
│   ├── main.py                       ← API routes + scan pipeline orchestration
│   ├── models.py                     ← Pydantic schemas (SHARED CONTRACT — isse mat chhedo)
│   ├── state_manager.py              ← In-memory scan state store
│   ├── requirements.txt              ← Python dependencies
│   ├── Dockerfile
│   └── engines/
│       ├── recon.py                  ← Member 1: Web crawler + header checker
│       ├── detection.py              ← Member 1: SQLi / XSS / Header scanners
│       ├── ai_orchestrator.py        ← Member 2: Claude AI analysis engine
│       └── reporter.py               ← Member 3: Markdown + PDF export
│
├── frontend/
│   └── src/
│       ├── App.tsx                   ← App shell + page routing
│       ├── main.tsx                  ← React entry point
│       ├── index.css                 ← Global styles (Tailwind import)
│       ├── types/index.ts            ← TypeScript types (SHARED — isse mat chhedo)
│       ├── utils/api.ts              ← Backend API call functions
│       ├── hooks/useScan.ts          ← Polling hook (scan status track karta hai)
│       ├── pages/
│       │   ├── Dashboard.tsx         ← Main scan input page
│       │   ├── ScanResults.tsx       ← Completed scan results page
│       │   └── ScanHistory.tsx       ← Past scans list
│       └── components/
│           ├── ScanProgress.tsx      ← Live pipeline status indicator
│           ├── MetricsBar.tsx        ← Severity + verdict count cards
│           ├── ReconPanel.tsx        ← Crawl results display
│           ├── FindingsTable.tsx     ← Master vulnerability table
│           └── FindingDetail.tsx     ← Drill-down: AI analysis + fix code
│
├── docker-compose.yml
└── README.md
```

**Golden Rule:** `models.py` aur `types/index.ts` ek saath change karo — ye dono shared contract hain. Ek badla aur doosra nahi — poora project toot jaayega.

---

## 3. OpenCode Setup — Pehli Baar

### Terminal mein OpenCode kaise open karein

```bash
# Project folder mein jao
cd path/to/0xverdict

# OpenCode start karo
opencode
```

### Pehli baar yeh context prompt dena — ZAROORI HAI

Jab bhi nayi OpenCode session shuru karo, **pehla prompt yahi hona chahiye:**

```
I am working on a project called 0xVerdict — an AI-powered web vulnerability 
scanner. The stack is:
- Backend: FastAPI (Python 3.12), aiohttp for async HTTP, Anthropic SDK for 
  Claude AI, Pydantic v2 for data validation
- Frontend: React 19, TypeScript, Vite 8, Tailwind CSS v4 (no PostCSS needed)
- The backend runs on port 8000, frontend dev server on port 8443
- Key constraint: models.py and frontend/src/types/index.ts share the same 
  data schema — any change to one must be reflected in the other
- The AI engine uses claude-sonnet-4-6 model via Anthropic API

Please confirm you understand the project structure before I give you tasks.
```

**Verify karo:** OpenCode ne structure confirm kiya ya nahi. Agar usne kuch aur assume kiya ho toh correct karo.

---

## 4. Verify Kaise Karte Hain — Rule #1

> **Ye section sabse important hai. Har prompt ke baad ye steps follow karo.**

### Backend change ke baad verify karna

```bash
# 1. Python syntax check
cd backend
python -m py_compile main.py engines/recon.py engines/detection.py \
  engines/ai_orchestrator.py engines/reporter.py models.py state_manager.py
echo "Syntax OK"

# 2. Import check
python -c "
from engines.recon import ReconEngine
from engines.detection import DetectionEngine
from engines.ai_orchestrator import AIOrchestrator
from engines.reporter import ReportingEngine
from models import ScanRequest, Finding, AIAnalysis
print('All imports OK')
"

# 3. Server start test (Ctrl+C se band karo)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend change ke baad verify karna

```bash
cd frontend

# 1. TypeScript type check (errors dikhayega bina build ke)
npx tsc --noEmit

# 2. Dev server start karo aur browser mein dekho
npm run dev
# Browser mein: http://localhost:8443
```

### Full integration verify karna

```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Test scan API directly
curl -X POST http://localhost:8000/scan/start \
  -H "Content-Type: application/json" \
  -d '{"target_url": "http://testphp.vulnweb.com"}' | python -m json.tool
```

**Agar kuch toot gaya:**
1. Error message copy karo
2. OpenCode ko do (Section 9 dekho — Corrective Prompts)
3. Phir se verify karo

---

## 5. Backend Improvements — Prompts + Verify Steps

---

### 5.1 — Naye SQLi Payloads Add Karna

**Kab karo:** Jab aur zyada SQL injection patterns detect karne ho.

**OpenCode Prompt:**
```
In the file backend/engines/detection.py, expand the SQLI_PAYLOADS list to 
include at least 10 more advanced payloads covering:
1. Boolean-based blind SQLi (e.g., AND 1=1, AND 1=2)
2. Union-based extraction (e.g., UNION SELECT table_name FROM information_schema.tables)
3. Error-based extraction for MSSQL (e.g., CONVERT(int, @@version))
4. PostgreSQL-specific payloads (e.g., pg_sleep(3))

Also expand SQLI_ERROR_PATTERNS to include MSSQL and PostgreSQL error signatures.

Do NOT change the function signatures, class structure, or the Finding dict 
schema — only add to the two lists at the top of the file.
```

**Verify Karo:**
```bash
cd backend
python -c "
from engines.detection import SQLI_PAYLOADS, SQLI_ERROR_PATTERNS
print(f'SQLi payloads: {len(SQLI_PAYLOADS)}')  # Should be 20+
print(f'Error patterns: {len(SQLI_ERROR_PATTERNS)}')  # Should be 20+
assert len(SQLI_PAYLOADS) > 10, 'Payloads nahi bade!'
print('OK')
"
```

**Agar galat output aaya:** Section 9.1 dekho.

---

### 5.2 — AI System Prompt Improve Karna

**Kab karo:** Jab AI ke verdicts weak lag rahe ho, ya hallucination ho rahi ho.

**OpenCode Prompt:**
```
In backend/engines/ai_orchestrator.py, improve the SYSTEM_PROMPT string to:
1. Add explicit instructions to NEVER return "Confirmed" without direct 
   evidence in the raw_evidence field
2. Add instruction: if raw_evidence contains only a timeout or generic error, 
   verdict must be "Needs Manual Verification" not "Confirmed"
3. Add instruction: severity_classified must be one level lower than 
   scanner_severity if evidence is indirect (e.g., time-based only)
4. Add a section: "EVIDENCE QUALITY RUBRIC" with 3 tiers:
   - Tier 1 (Strong): Direct error message / payload in response → Confirmed OK
   - Tier 2 (Moderate): Timing anomaly / behavioral change → Needs Manual Verification
   - Tier 3 (Weak): Only status code change → Likely False Positive

Only modify the SYSTEM_PROMPT string. Do not touch any function or class.
```

**Verify Karo:**
```bash
cd backend
python -c "
from engines.ai_orchestrator import SYSTEM_PROMPT
assert 'EVIDENCE QUALITY RUBRIC' in SYSTEM_PROMPT, 'Rubric missing!'
assert 'Tier 1' in SYSTEM_PROMPT, 'Tiers missing!'
assert len(SYSTEM_PROMPT) > 800, 'Prompt too short!'
print(f'System prompt length: {len(SYSTEM_PROMPT)} chars — OK')
"
```

---

### 5.3 — Rate Limiting Add Karna (API Protection)

**Kab karo:** Jab production mein deploy karna ho aur abuse se bachana ho.

**OpenCode Prompt:**
```
In backend/main.py, add rate limiting using slowapi library.
Requirements:
1. Add slowapi to the imports: from slowapi import Limiter, _rate_limit_exceeded_handler
2. Create a limiter: limiter = Limiter(key_func=get_remote_address)
3. Apply @limiter.limit("10/minute") to the POST /scan/start endpoint only
4. Add the limiter to app state and register the rate limit exceeded handler
5. Add "slowapi>=0.1.9" to requirements.txt

Do NOT add rate limiting to GET endpoints — only the scan start endpoint.
Test that the app still imports cleanly.
```

**Verify Karo:**
```bash
pip install slowapi --break-system-packages -q
cd backend
python -c "from main import app; print('App imports OK')"
grep "slowapi" requirements.txt && echo "requirements.txt updated OK"
grep "10/minute" main.py && echo "Rate limit applied OK"
```

---

### 5.4 — Scan Results Ko File Mein Save Karna (Persistence)

**Kab karo:** Jab server restart hone par scan history lost ho jaati ho.

**OpenCode Prompt:**
```
Modify backend/state_manager.py to add JSON file persistence:
1. Add a SCANS_DIR constant: SCANS_DIR = Path("./scan_data")
2. In __init__, create the directory: SCANS_DIR.mkdir(exist_ok=True)
3. Add a private method _save_to_disk(scan_id) that writes the scan state 
   as JSON to SCANS_DIR/{scan_id}.json
4. Call _save_to_disk at the end of finalize_scan() and mark_failed()
5. In __init__, load all existing JSON files from SCANS_DIR into self._store
   (so history survives server restarts)
6. Use Python's json module — no new dependencies needed

The in-memory dict self._store must still work exactly as before.
All existing method signatures must stay identical.
```

**Verify Karo:**
```bash
cd backend
python -c "
from state_manager import ScanStateManager
from pathlib import Path
sm = ScanStateManager()
sm.init_scan('test-persist', 'http://example.com')
sm.mark_failed('test-persist', 'test error')
assert Path('./scan_data/test-persist.json').exists(), 'File not saved!'
sm2 = ScanStateManager()  # New instance — should load from disk
assert sm2.get_state('test-persist') is not None, 'Not loaded from disk!'
print('Persistence OK')
import shutil; shutil.rmtree('./scan_data')  # cleanup
"
```

---

### 5.5 — Scan Ko Cancel Karna (New Endpoint)

**OpenCode Prompt:**
```
Add a new API endpoint to backend/main.py:
  DELETE /scan/{scan_id}

This endpoint should:
1. Check if the scan exists in state_manager
2. If scan_status is "Completed" or "Failed", return error: 
   {"error": "Cannot cancel a finished scan"}
3. Otherwise, call state_manager.mark_failed(scan_id, "Cancelled by user")
4. Return {"message": "Scan cancelled", "scan_id": scan_id}

Also add a cancel_scan(scan_id) convenience method to state_manager.py 
that sets status to "Cancelled" (not "Failed") with message "Cancelled by user".
```

**Verify Karo:**
```bash
cd backend
python -c "from main import app; print([r.path for r in app.routes])" | grep -i "scan"
# Should show DELETE route
uvicorn main:app --port 8001 &
sleep 2
curl -X DELETE http://localhost:8001/scan/nonexistent | python -m json.tool
kill %1
```

---

## 6. Frontend Improvements — Prompts + Verify Steps

---

### 6.1 — Dark/Light Mode Toggle Add Karna

**OpenCode Prompt:**
```
Add a dark/light mode toggle to the React frontend:

1. In frontend/src/App.tsx:
   - Add useState<'dark' | 'light'>('dark') for theme
   - Apply the theme class to the root div: className={theme === 'dark' ? 'dark' : ''}
   - Add a toggle button in the nav bar (after the version indicator)
   - The button should show a sun icon in dark mode and moon icon in light mode
   - Use only SVG icons (no external icon library)

2. In frontend/src/index.css:
   - Add CSS variables for both themes using Tailwind's @layer base
   - --bg-primary: #0a0a0f (dark) / #f8fafc (light)
   - --text-primary: #f1f5f9 (dark) / #0f172a (light)

3. In App.tsx, pass the theme prop down to Dashboard via props so Dashboard 
   can apply appropriate bg classes.

Use Tailwind CSS v4 utility classes only. No external packages.
```

**Verify Karo:**
```bash
cd frontend
npx tsc --noEmit  # No TypeScript errors
npm run dev
# Browser mein:
# 1. Toggle button visible hai nav mein?
# 2. Click karne par bg change hota hai?
# 3. Console mein koi error nahi?
```

---

### 6.2 — Finding Search/Filter Add Karna

**OpenCode Prompt:**
```
In frontend/src/components/FindingsTable.tsx, add a search bar above the 
findings table:

1. Add useState<string>('') for searchQuery
2. Add a text input styled like the existing filter select:
   - Placeholder: "Search by endpoint, type, or CVE..."
   - className: match existing select element style (dark bg, border, etc.)
3. Filter the findings array: a finding matches if searchQuery (case-insensitive) 
   appears in finding.type OR finding.endpoint OR finding.raw_evidence
4. The search filter should combine with the existing verdict filter 
   (both must pass for a finding to show)
5. Show a "X results" count below the search bar

Do not change the FindingDetail component or the export buttons.
```

**Verify Karo:**
```bash
cd frontend
npx tsc --noEmit
# Manual: npm run dev, type "login" in search — only /login findings show
# Type "SQL" — only SQL Injection findings show
# Combine with verdict filter — both work together
```

---

### 6.3 — Toast Notifications Add Karna

**OpenCode Prompt:**
```
Add a simple toast notification system to the React frontend without any 
external library:

1. Create frontend/src/components/Toast.tsx:
   - Props: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }
   - Fixed position: bottom-right corner
   - Auto-dismiss after 4 seconds using useEffect
   - Animate in with a slide-up CSS transition
   - Colors: success=emerald, error=red, info=sky (match existing color scheme)

2. Create frontend/src/hooks/useToast.ts:
   - Returns { showToast, ToastContainer }
   - showToast(message, type) adds to a list
   - ToastContainer renders all active toasts

3. In frontend/src/pages/Dashboard.tsx:
   - Import useToast
   - Show success toast when scan completes: "Scan complete — X findings analyzed"
   - Show error toast when scan fails

Use only React hooks and Tailwind CSS. No react-hot-toast or similar libraries.
```

**Verify Karo:**
```bash
cd frontend
npx tsc --noEmit
# Manual: Start a scan → completion pe toast dikhta hai?
# Error case: invalid URL dalo → error toast?
# Toast 4 seconds mein khud band hota hai?
```

---

### 6.4 — Findings Export to CSV

**OpenCode Prompt:**
```
Add a CSV export button to frontend/src/components/FindingsTable.tsx:

1. Add a new button next to the existing .md and PDF buttons
2. Label: "CSV" with a download icon (same style as .md button)
3. On click, generate a CSV string with these columns:
   ID, Type, Endpoint, Verdict, AI Severity, Priority, Scanner Severity, Payload
4. Use browser's built-in Blob and URL.createObjectURL to trigger download
   Filename: 0xverdict-{scanId}-findings.csv
5. Escape commas and quotes in field values properly

No external CSV library. Pure TypeScript only.
```

**Verify Karo:**
```bash
cd frontend
npx tsc --noEmit
# Manual: CSV button dikhta hai?
# Click karne par file download hoti hai?
# Open in Excel/Sheets — columns sahi hain?
# Commas wale fields quotes mein hain?
```

---

## 7. New Features Add Karna

---

### 7.1 — New Scanner: Open Redirect Detection

**OpenCode Prompt:**
```
Add a new scanner module to backend/engines/detection.py for Open Redirect 
detection:

1. Add OPEN_REDIRECT_PAYLOADS list at the top:
   ["https://evil.com", "//evil.com", "/\\evil.com", "https:evil.com"]

2. Add method _scan_open_redirect(self, session) to DetectionEngine class:
   - For each page in self.recon_data['pages_found']:
     - Append common redirect params: ?redirect=PAYLOAD, ?next=PAYLOAD, 
       ?url=PAYLOAD, ?return=PAYLOAD, ?goto=PAYLOAD
     - Send GET request with allow_redirects=False (aiohttp: allow_redirects=False)
     - If response status is 301/302 AND Location header contains the payload 
       domain — it's a finding
   - Add to self.findings with type="Open Redirect", scanner_severity="Medium"

3. Call _scan_open_redirect in the run() method alongside other scanners.

Follow the exact same Finding dict structure as existing scanners.
```

**Verify Karo:**
```bash
cd backend
python -c "
from engines.detection import DetectionEngine, OPEN_REDIRECT_PAYLOADS
assert len(OPEN_REDIRECT_PAYLOADS) >= 4, 'Payloads missing'
import inspect
methods = [m for m in dir(DetectionEngine) if 'redirect' in m.lower()]
assert len(methods) > 0, 'Method not found!'
print('Open Redirect scanner OK:', methods)
"
```

---

### 7.2 — Scan Comparison Feature (Frontend)

**OpenCode Prompt:**
```
Add a scan comparison feature to frontend/src/pages/ScanHistory.tsx:

1. Add checkbox to each scan row for selection
2. Add a "Compare Selected" button that appears when exactly 2 scans are checked
3. Create frontend/src/components/ScanComparison.tsx:
   - Props: { scanA: ScanListItem, scanB: ScanListItem }
   - Side-by-side table showing:
     | Metric | Scan A | Scan B | Change |
     | Total Findings | X | Y | ↑ or ↓ |
     | Confirmed | ... | ... | ... |
     | Critical | ... | ... | ... |
     | High | ... | ... | ... |
   - Change column: green ↓ if fewer findings (better), red ↑ if more
   - Show scan date and target URL for each

4. Add a modal wrapper with overlay backdrop to show the comparison.

Use only existing TypeScript types from types/index.ts. No new types needed.
```

**Verify Karo:**
```bash
cd frontend
npx tsc --noEmit
# Manual:
# 1. History page mein checkboxes dikhte hain?
# 2. Ek select → button nahi dikhta
# 3. Do select → "Compare Selected" button dikhta hai
# 4. Button click → modal opens with side-by-side table
# 5. Change column mein arrows sahi direction mein hain?
```

---

## 8. Bug Fix Karna

---

### 8.1 — Forms Detect Nahi Ho Rahi (Recon Bug)

**Symptom:** `forms_found: []` aa raha hai jab clearly forms hain page par.

**OpenCode Prompt:**
```
In backend/engines/recon.py, the LinkFormParser is not detecting forms 
correctly. Debug and fix the following:

1. The current parser only captures inputs INSIDE a form tag but some sites 
   use dynamically placed inputs — add a fallback that captures any <input> 
   element with a name attribute even if not inside a <form> tag currently 
   being tracked, and associates it with the closest preceding form

2. Add support for <select> elements as form inputs (same as textarea handling)

3. The parser currently skips forms with no inputs — change this to also 
   include forms that have at least one input even of type "hidden" (hidden 
   inputs can be injection vectors too)

4. Add a max_forms limit of 50 to prevent memory issues on large sites

Test: after the fix, the form with only hidden inputs should appear in forms_found.
```

**Verify Karo:**
```bash
cd backend
python -c "
from engines.recon import LinkFormParser
# Test with form containing only hidden input
html = '''<form action='/login' method='POST'>
  <input type='hidden' name='csrf_token' value='abc'>
  <input type='text' name='username'>
</form>'''
parser = LinkFormParser('http://test.com')
parser.feed(html)
print('Forms found:', parser.forms)
assert len(parser.forms) == 1, 'Form not detected!'
assert any(inp['name'] == 'csrf_token' for inp in parser.forms[0]['inputs']), 'Hidden input missing!'
print('OK')
"
```

---

### 8.2 — PDF Report Download Fail Ho Raha Hai

**Symptom:** PDF download button click hone par 500 error aata hai.

**OpenCode Prompt:**
```
In backend/engines/reporter.py, the generate_pdf method fails silently 
when weasyprint is not installed. Fix this:

1. Add proper try/except with logging for each PDF method
2. Add a third fallback using fpdf2 library (add "fpdf2>=2.7.0" to requirements.txt):
   - Cover page with title, target URL, date
   - Executive summary table
   - One page per finding with: type, endpoint, verdict, severity, fix_recommendation
   - Legal disclaimer on last page
3. If ALL methods fail, return a proper HTTPException with status 503 and 
   message "PDF generation unavailable — download Markdown instead"
4. In main.py, update the PDF endpoint to catch this exception and return 
   proper JSON error response

Also add a health check for PDF capability at GET /health that returns:
{"pdf_available": true/false, "method": "weasyprint|reportlab|fpdf2|none"}
```

**Verify Karo:**
```bash
pip install fpdf2 --break-system-packages -q
cd backend
python -c "
from engines.reporter import ReportingEngine
mock = {'scan_id': 't1', 'target_url': 'http://x.com', 'scan_date': '2026-07-20',
        'scan_status': 'Completed', 'scan_duration': '10s',
        'summary': {'total_findings':0,'confirmed':0,'needs_verification':0,
                    'false_positives':0,'critical':0,'high':0,'medium':0,'low':0,'info':0},
        'recon_data': None, 'findings': []}
r = ReportingEngine(mock)
path = r.generate_pdf('test-001')
print('PDF generated at:', path)
import os; assert os.path.exists(path), 'PDF file missing!'
print('PDF OK')
"
curl http://localhost:8000/health 2>/dev/null | python -m json.tool
```

---

## 9. Galat Output Aaya — Corrective Prompts

Ye section tab use karo jab OpenCode ne kuch aisa kiya jo tune nahi manga tha.

---

### 9.1 — OpenCode ne extra imports add kar diye

```
You added imports for [LIBRARY_NAME] but I did not ask for any new dependencies.
Please revert ONLY the import statements and any usage of [LIBRARY_NAME].
Keep all other changes exactly as they are.
Show me the specific lines you are reverting.
```

---

### 9.2 — OpenCode ne function signature change kar di

```
The function signature for [FUNCTION_NAME] has been changed from:
  [OLD SIGNATURE]
to:
  [NEW SIGNATURE]

This breaks the existing callers in [FILE_NAME]. Please revert ONLY the 
function signature to the original. The internal implementation changes 
you made can stay.
```

---

### 9.3 — TypeScript errors aa rahe hain

```
Running `npx tsc --noEmit` shows these errors:
[PASTE EXACT ERROR OUTPUT HERE]

Please fix ONLY these TypeScript errors. Do not refactor any working code.
The most likely cause is a type mismatch — check frontend/src/types/index.ts 
to see the exact interface definitions and align your code to them.
```

---

### 9.4 — OpenCode ne models.py change kar diya

```
STOP. You have modified backend/models.py. This file is the shared data 
contract between the backend and frontend. Any change here requires a 
corresponding change in frontend/src/types/index.ts.

Please tell me exactly what fields you changed/added in models.py, and then
provide the corresponding TypeScript interface changes needed in types/index.ts.
I will review both together before applying.
```

---

### 9.5 — Scan kuch return nahi kar raha / stuck hai

```
The scan is getting stuck at [STAGE_NAME] stage and never progressing.
Looking at backend/main.py's run_scan_pipeline function, identify:
1. At which await call could it be hanging?
2. Is there a missing try/except that could silently swallow an exception?
3. Add debug logging (print statements) at the start of each pipeline stage 
   so we can see exactly where it stops.
Do not change any logic — only add print/logging statements for debugging.
```

---

### 9.6 — Ek file accidentally delete ho gayi

```
The file [FILE_PATH] appears to have been deleted or corrupted during your 
last edit. Please recreate it with the following specification:
[DESCRIBE WHAT THE FILE SHOULD DO]
It should match the original imports and exports that other files depend on.
Check which files import from this module first: grep -r "[MODULE_NAME]" src/
```

---

## 10. Production Ready Banana

Yeh steps tab karo jab project demo ke liye ya deployment ke liye taiyar karna ho.

---

### 10.1 — Environment Variables Properly Set Karna

**OpenCode Prompt:**
```
Create a backend/.env.example file documenting all required environment variables:
ANTHROPIC_API_KEY=sk-ant-...   # Required: Anthropic API key
PORT=8000                       # Optional: API server port (default: 8000)
SCAN_DATA_DIR=./scan_data       # Optional: where to persist scan JSON files
MAX_CONCURRENT_SCANS=5          # Optional: max parallel scans (default: 5)
CRAWL_DEPTH=2                   # Optional: how deep to crawl (default: 2)
MAX_PAGES=30                    # Optional: max pages per scan (default: 30)

Then update backend/main.py and the engine files to read these from 
os.environ with proper defaults using os.environ.get('VAR', default_value).
```

---

### 10.2 — CORS Restrict Karna

**OpenCode Prompt:**
```
In backend/main.py, the CORS middleware currently allows all origins ("*").
Update it to:
1. Read allowed origins from environment variable ALLOWED_ORIGINS 
   (comma-separated, e.g., "http://localhost:3000,https://yourdomain.com")
2. If ALLOWED_ORIGINS is not set, default to ["http://localhost:3000", 
   "http://localhost:8443"] for development
3. Keep allow_credentials=True and the existing methods/headers settings
```

---

### 10.3 — Health Check Endpoint

**OpenCode Prompt:**
```
Add a comprehensive health check endpoint at GET /health in backend/main.py:
{
  "status": "healthy",
  "version": "1.0.0",
  "anthropic_api": "connected" or "not configured",
  "active_scans": <count of non-completed scans>,
  "total_scans": <total scan count>,
  "pdf_generation": "available" or "unavailable"
}

For anthropic_api check: if ANTHROPIC_API_KEY env var exists and starts with 
"sk-ant-", return "connected". Otherwise "not configured".
This endpoint should have NO rate limiting.
```

**Verify Karo:**
```bash
curl http://localhost:8000/health | python -m json.tool
# Check: sab fields present hain?
# anthropic_api field sahi hai?
```

---

## 11. Common Mistakes aur Unse Bachna

| Galti | Kya hota hai | Kaise bachein |
|-------|--------------|---------------|
| `models.py` badla, `types/index.ts` nahi | Frontend TypeScript errors | Dono files ek saath batao OpenCode ko |
| `pip install X` bina `requirements.txt` update kiye | Docker build fail | Hamesha requirements.txt update karne bol |
| `async def` mein `await` bhool gaye | Function silently hang karta hai ya None return karta hai | Verify step mein direct API call karo |
| Tailwind v4 mein v3 class use ki | Style apply nahi hota | v4 mein `@apply` alag hai — utility classes directly use karo |
| Port 8000 already use mein hai | Server start nahi hota | `lsof -i :8000` se check karo, ya port change karo |
| OpenCode ne poora file rewrite kar diya | Sab kuch toot gaya | Git commit pehle karo, phir prompt do |

---

### Git Workflow — ZAROORI

Har OpenCode session se pehle:
```bash
git add -A && git commit -m "checkpoint before opencode session"
```

Agar kuch toot gaya:
```bash
git diff                    # kya badla dekho
git checkout -- [file]      # specific file revert karo
git reset --hard HEAD       # sab revert karo (nuclear option)
```

---

## 12. Quick Reference Card

### OpenCode Session Start Karne Ka Template

```
Context: 0xVerdict project — FastAPI backend (port 8000) + React 19 frontend 
(port 8443). Python 3.12, Pydantic v2, Tailwind CSS v4.

Task: [APNA TASK YAHAN LIKHO]

Constraints:
- Do NOT modify models.py or frontend/src/types/index.ts unless I explicitly say so
- Do NOT add new npm/pip packages without telling me first
- Do NOT change existing function signatures
- Show me a diff/summary of changes before writing to files if the change 
  is more than 20 lines

File to modify: [FILE PATH]
```

### Verify Commands Cheatsheet

```bash
# Backend Python syntax
python -m py_compile backend/*.py backend/engines/*.py

# Frontend TypeScript
cd frontend && npx tsc --noEmit

# Full server test
cd backend && uvicorn main:app --port 8000 &
curl http://localhost:8000/ 
kill %1

# Check a specific import works
python -c "from engines.X import Y; print('OK')"

# Docker full build test
docker compose build --no-cache
```

### Scan Status Flow

```
Initiated → Reconnoitering → Scanning → AI Analyzing → Completed
                                                      ↘ Failed
```

### Severity Levels (Backend → Frontend must match)

```python
# Backend (models.py)
Literal["Critical", "High", "Medium", "Low", "Info"]

# Frontend (types/index.ts)
type Severity = "Critical" | "High" | "Medium" | "Low" | "Info"
```

---

> **Last Note:** OpenCode ek tool hai — tu product owner hai. Har output ko fresh aankhon se dekh. Agar kuch "off" lagta hai even agar TypeScript pass bhi ho jaye — trust your gut, verify karo, aur corrective prompt do. Credit tab bachta hai jab pehle baar hi sahi karo.

---

*0xVerdict v1.0.0 — AISCN'26 Internship Project*
*Legal: Sirf authorized targets par test karo. Unauthorized scanning illegal hai.*
