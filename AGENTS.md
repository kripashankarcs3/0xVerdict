# 0xVerdict

AI-Powered Web Vulnerability Scanner

## Structure

```
0xVerdict/
├── frontend/       React + Vite + Tailwind CSS (port 8443)
├── backend/        FastAPI Python backend (port 5432)
├── .env            Environment variables
├── package.json    Root scripts (dev, build)
└── README.md
```

## Development

### Frontend
```bash
npm run dev        # starts Vite on port 8443
```

### Backend
```bash
cd backend
venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 5432 --reload
```

## Deployment

- Frontend: Vercel (root: `frontend/`)
- Backend: Render Web Service (root: `backend/`)
