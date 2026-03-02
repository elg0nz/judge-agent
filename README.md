# judge-agent

Paste text. Get a score. Know if a human wrote it.

judge-agent detects whether content was written by a human or an AI. It returns a **humanness score (0–100)**, the top signals that drove the score, and a one-paragraph explanation. The score is a judgment call, not a probability — it makes a call and explains it.

---

## Running it locally

→ **[GETTING_STARTED.md](GETTING_STARTED.md)** — step-by-step setup, under 10 minutes

**What you need:**
- Python 3.11+
- Node.js 18+
- An Anthropic API key

**The short version:**
```bash
# Backend
cd backend && pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

→ Open [http://localhost:3000](http://localhost:3000)

---

## What it does

| Input | Output |
|-------|--------|
| Any text | Score 0–100 (0 = AI, 100 = human) |
| | Top 1–5 signals that drove the score |
| | One-paragraph explanation |

The detection looks at structural patterns, vocabulary distribution, coherence, emotional register, and specificity of claims — signals that individually are weak but together are informative.

---

## Project structure

```
judge-agent/
├── backend/                  ← Python/FastAPI API
│   ├── app/
│   │   ├── agents/           ← AI detection logic (Agno + Claude)
│   │   ├── api/              ← HTTP endpoints
│   │   ├── core/             ← Config, settings
│   │   └── db/               ← Database layer (SQLite default)
│   ├── tests/
│   │   ├── eval_detection.py ← Accuracy eval against labeled samples
│   │   └── fixtures/         ← AI and human text samples
│   └── scripts/
│       └── dev.sh            ← Shortcut to start the server
├── frontend/                 ← Next.js / React UI
│   └── app/
│       ├── page.tsx          ← Main judge interface
│       └── lib/              ← API client, types, constants
├── docs/
│   ├── CHANGELOG.md          ← What changed in each release
│   ├── v0.0.1-pre/           ← Current feature spec
│   └── v0.0.0/               ← Released: project scaffolding
├── GETTING_STARTED.md        ← How to run it (start here)
├── ARCHITECTURE.md           ← Design decisions and trade-offs
└── CLAUDE.md                 ← Instructions for AI agents working on this repo
```

---

## API

One endpoint:

```
POST /judge
Content-Type: application/json

{ "content": "text to evaluate" }
```

Response:
```json
{
  "score": 12,
  "signals": ["uniform paragraph length", "'leverage' and 'nuanced' vocabulary cluster"],
  "explanation": "The text displays..."
}
```

Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs) once the backend is running.

---

## Development process

This project follows **BARDD** — specs are written before code. Every feature starts as a doc in `docs/v0.x.y-pre/README.md`, gets implemented against its acceptance criteria, then the `-pre` suffix is dropped on merge.

Current release: **v0.0.1** — AI detection end-to-end
Spec: [docs/v0.0.1-pre/README.md](docs/v0.0.1-pre/README.md)
History: [docs/CHANGELOG.md](docs/CHANGELOG.md)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Backend | Python / FastAPI |
| AI agent | Agno + Anthropic Claude |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | Next.js 15 / React / TypeScript |
