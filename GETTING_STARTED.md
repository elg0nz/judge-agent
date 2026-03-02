# Getting Started

This guide covers how to run the judge-agent system locally and how to execute the AI detection evals.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

> **Database:** SQLite is the default — no database setup required for local dev. To use PostgreSQL instead, set `DATABASE_URL=postgresql://...` in `backend/.env` and run `pip install -e ".[postgres]"`.

---

## 1. Configure environment

### Backend

```bash
cd backend
# .env already exists — just fill in your API key:
```

Open `backend/.env` and set:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend

The frontend is pre-configured. `frontend/.env.local` already points to `http://localhost:8000`. No changes needed for local dev.

---

## 2. Start the backend

```bash
cd backend

# First time: install dependencies
pip install -e ".[dev]"

# Start the server (auto-reloads on file changes)
bash scripts/dev.sh
# or directly:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- `http://localhost:8000` — root
- `http://localhost:8000/health` — health check
- `http://localhost:8000/docs` — interactive Swagger UI
- `http://localhost:8000/judge` — AI detection endpoint (POST)

### Quick API test

```bash
curl -X POST http://localhost:8000/judge \
  -H "Content-Type: application/json" \
  -d '{"content": "In the rapidly evolving landscape of AI, it is crucial to leverage multifaceted approaches to ensure nuanced outcomes."}'
```

Expected response:
```json
{
  "score": 12,
  "signals": ["'landscape', 'crucial', 'leverage', 'nuanced' — classic AI vocabulary cluster", "..."],
  "explanation": "..."
}
```

---

## 3. Start the frontend

```bash
cd frontend

# First time: install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:3000`. You'll see the judge interface — paste any text and click **Judge**.

Score interpretation:
- **0–29** (red) — Likely AI-generated
- **30–69** (yellow) — Ambiguous
- **70–100** (green) — Likely human-written

---

## 4. Run the evals

The eval script tests the judge agent against 10 labeled samples (5 AI, 5 human) and checks that:
- AI samples score **< 30**
- Human samples score **> 70**

```bash
cd backend

# Requires ANTHROPIC_API_KEY to be set in .env or your environment
python tests/eval_detection.py
```

Example output:
```
=== AI Detection Eval ===

AI samples (expect score < 30):
  [PASS] ai #1 (synthetic): score=8 — In today's rapidly evolving landscape, it's im...
  [PASS] ai #2 (synthetic): score=12 — Artificial intelligence has become an integral...
  ...

Human samples (expect score > 70):
  [PASS] human #1 (synthetic): score=82 — I've been thinking about this for weeks and...
  [PASS] human #2 (synthetic): score=91 — hot take: the obsession with 'clean code' h...
  ...

=== Summary ===
AI samples:    5/5 passed
Human samples: 5/5 passed
Overall:       10/10 passed (100%)
```

---

## Troubleshooting

**`ImportError: No module named 'agno'`**
```bash
cd backend && pip install -e ".[dev]"
```

**`AuthenticationError: Invalid API key`**
Check that `ANTHROPIC_API_KEY` is set correctly in `backend/.env`.

**Frontend can't reach backend**
Make sure the backend is running on port 8000 and `NEXT_PUBLIC_API_URL` in `frontend/.env.local` matches.

**CORS error in browser**
The backend allows `http://localhost:3000` by default. If you're running the frontend on a different port, update `CORS_ORIGINS` in `backend/.env`.
