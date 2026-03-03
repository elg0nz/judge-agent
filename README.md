# judge-agent

Agentic system to detect non-human created content.

judge-agent analyzes content and returns a multi-dimensional judgment: **origin** (AI vs. human with confidence and signals), **virality score** (0–100 with drivers), **distribution analysis** (audience segments with platforms and predicted reactions), and a prose **explanation**. It makes a call and explains it.

---

## Running it locally

→ **[GETTING_STARTED.md](GETTING_STARTED.md)** — step-by-step setup, under 10 minutes

**What you need:**
- Python 3.11+
- Node.js 18+
- An Anthropic API key
- ElevenLabs API key (only required for video mode): [console.elevenlabs.io](https://console.elevenlabs.io/)

**The short version:**
```bash
# Backend
cd backend && pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

→ Open [http://localhost:3000](http://localhost:3000)

> **PoC note:** The login screen accepts any username — no password, no email. If the backend is reachable the user is registered automatically; if not, a local session is created and full functionality (run history, feedback) requires the backend to be up.

---

## What it does

| Input | Output |
|-------|--------|
| Any text (or video) | **Origin** — AI-generated or human-generated, with confidence and signals |
| | **Virality** — score 0–100 with drivers |
| | **Distribution** — 2–4 audience segments with platforms and predicted reactions |
| | **Explanation** — prose analysis |

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
│   ├── v0.0.4-pre/ … v0.0.8-pre/  ← Upcoming feature specs
│   ├── v0.0.3/               ← Released: user identity + run history
│   ├── v0.0.2/               ← Released: full judge schema + DBOS
│   ├── v0.0.1/               ← Released: AI detection end-to-end
│   └── v0.0.0/               ← Released: project scaffolding
├── GETTING_STARTED.md        ← How to run it (start here)
├── ARCHITECTURE.md           ← Design decisions and trade-offs
└── CLAUDE.md                 ← Instructions for AI agents working on this repo
```

---

## API

### Analyze text

```
POST /judge
Content-Type: application/json

{ "content": "text to evaluate", "user_uuid": "optional-user-uuid" }
```

Response:
```json
{
  "origin": {
    "prediction": "AI-generated",
    "confidence": 0.92,
    "signals": ["uniform paragraph length", "'leverage' and 'nuanced' vocabulary cluster"]
  },
  "virality": {
    "score": 25,
    "drivers": ["no emotional hook", "generic framing"]
  },
  "distribution": [
    {
      "segment": "Tech Twitter",
      "platforms": ["twitter", "linkedin"],
      "reaction": "ignore"
    }
  ],
  "explanation": "The text displays classic AI-generated patterns..."
}
```

### Other endpoints

- `POST /auth/signup` — create or retrieve user by username
- `GET /judge/history?user_uuid=...` — past runs for a user

Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs) once the backend is running.

---

## Development process

This project follows **BARDD** — specs are written before code. Every feature starts as a doc in `docs/v0.x.y-pre/README.md`, gets implemented against its acceptance criteria, then the `-pre` suffix is dropped on merge.

Current release: **v0.0.3** — User identity + run history
Next: **v0.0.4-pre** — Fix docs + ElevenLabs wiring
History: [docs/CHANGELOG.md](docs/CHANGELOG.md)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Backend | Python / FastAPI |
| AI agent | Agno + Anthropic Claude |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | Next.js 15 / React / TypeScript |
