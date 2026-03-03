# judge-agent

Analyzes content and makes a multi-dimensional call: **origin** (AI vs. human with confidence and signals), **virality score** (0–100 with drivers), **distribution** (2–4 audience segments with platforms and predicted reactions), and a prose **explanation**.

---

## What you need

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com/) |
| ElevenLabs API key | optional — video mode only | [console.elevenlabs.io](https://console.elevenlabs.io/) |

---

## Run it locally

Full step-by-step: **[GETTING_STARTED.md](GETTING_STARTED.md)**

Short version:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env           # then edit .env: add ANTHROPIC_API_KEY
pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter any username (no password — this is a PoC), paste text, click Analyze.

> **Warning: this is a proof-of-concept.** The login screen accepts any username with no password. If the backend is reachable the user is registered automatically; if not, a local session is created. Full functionality (run history, feedback) requires the backend to be up.

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

| Endpoint | What it does |
|----------|-------------|
| `POST /auth/signup` | Create or retrieve a user by username |
| `GET /judge/history?user_uuid=...` | Last 50 runs for a user |
| `POST /judge/video` | Analyze an uploaded video (requires `upload_id`) |
| `POST /upload` | Upload a video file; returns `upload_id` |
| `POST /feedback` | Submit thumbs up/down on a result |
| `GET /health` | Health check |

Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs) once the backend is running.

---

## Project structure

```
judge-agent/
├── backend/                  — Python/FastAPI API
│   ├── app/
│   │   ├── agents/           — AI detection logic (Agno + Claude)
│   │   ├── api/              — HTTP endpoints
│   │   ├── core/             — Config, settings
│   │   └── db/               — Database layer (SQLite default)
│   ├── tests/
│   │   ├── eval_detection.py — Accuracy eval against labeled samples
│   │   └── fixtures/         — AI and human text samples
│   └── scripts/
│       └── dev.sh            — Shortcut to start the server
├── frontend/                 — Next.js 15 / React / TypeScript UI
│   └── app/
│       ├── page.tsx          — Main judge interface
│       └── lib/              — API client, types, constants
├── docs/
│   ├── CHANGELOG.md          — What changed in each release
│   ├── v0.0.4-pre/ … v0.0.8-pre/  — Upcoming feature specs
│   ├── v0.0.3/               — Released: user identity + run history
│   ├── v0.0.2/               — Released: full judge schema + DBOS
│   ├── v0.0.1/               — Released: AI detection end-to-end
│   └── v0.0.0/               — Released: project scaffolding
├── GETTING_STARTED.md        — How to run it (start here)
├── ARCHITECTURE.md           — Design decisions and trade-offs
└── CLAUDE.md                 — Instructions for AI agents working on this repo
```

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Backend | Python / FastAPI |
| AI agent | Agno + Anthropic Claude (claude-sonnet-4-6) |
| Durable execution | DBOS (retries, workflow persistence) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | Next.js 15 / React 19 / TypeScript strict |
| Styling | Tailwind CSS v4 |

---

## Current release

**v0.0.3** — User identity + run history. Full history: [docs/CHANGELOG.md](docs/CHANGELOG.md)
