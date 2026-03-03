# Implementation Notes

API reference, project structure, and tech stack details.

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

### All endpoints

| Endpoint | What it does |
|----------|-------------|
| `POST /judge` | Analyze text. Caches by `md5(content + user_uuid)`. |
| `GET /judge/history?user_uuid=...` | Last 50 runs for a user |
| `POST /judge/video` | Analyze an uploaded video (requires `upload_id`) |
| `POST /upload` | Upload video (+ optional subtitle); returns `upload_id` |
| `GET /frames/<upload_id>` | List extracted frames with type labels |
| `GET /frames/<upload_id>/file/<name>` | Serve a single frame image |
| `POST /auth/signup` | Create or retrieve a user by username |
| `POST /feedback` | Submit thumbs up/down on a result |
| `GET /health` | Health check |

Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs) once the backend is running.

---

## Project structure

```
judge-agent/
├── backend/
│   ├── app/
│   │   ├── agents/           — AI detection logic (Agno + Claude)
│   │   │   ├── judge_agent.py    — agent, DBOS workflow, public run_judge()
│   │   │   ├── video_pipeline.py — transcribe + frame extract + judge workflow
│   │   │   ├── output.py         — Pydantic output models (JudgeOutput, etc.)
│   │   │   └── prompts/          — system prompt files
│   │   ├── api/              — HTTP endpoints (judge, upload, auth, frames, feedback)
│   │   ├── core/             — Config, settings (Pydantic BaseSettings)
│   │   └── db/               — SQLAlchemy models + DatabaseManager
│   ├── tests/
│   │   ├── eval_detection.py — accuracy eval against labeled samples
│   │   └── fixtures/         — ai_samples.json, human_samples.json
│   └── scripts/
│       └── dev.sh            — shortcut to start the server
├── frontend/
│   └── app/
│       ├── page.tsx          — full SPA: login, text mode, video mode, history
│       ├── components/       — Button, Card, Header, Footer
│       └── lib/              — api.ts, types.ts, constants.ts, hooks.ts, utils.ts
├── docs/
│   ├── CHANGELOG.md
│   └── v0.0.0/ … v0.0.8-pre/ — version specs (BARDD methodology)
├── README.md
├── GETTING_STARTED.md        — step-by-step setup with expected output
├── ARCHITECTURE.md           — design decisions, data flows, trade-offs
└── IMPLEMENTATION_NOTES.md   — this file
```

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Python / FastAPI | async, typed, OpenAPI auto-docs |
| AI agent | Agno + Anthropic `claude-sonnet-4-6` | structured output, vision, 100% eval accuracy |
| Durable execution | DBOS 2.x | checkpoint-and-resume on LLM/media failures, no external broker |
| Video transcription | ElevenLabs Scribe (`scribe_v1`) | speech-to-text when no subtitle provided |
| Frame extraction | ffmpeg (3 passes) | scene changes + uniform 2fps + I-frames |
| Database (dev) | SQLite | zero-config |
| Database (prod) | PostgreSQL | `pip install '.[postgres]'` + set `DATABASE_URL` |
| ORM | SQLAlchemy 2.x | typed mapped columns |
| Frontend | Next.js 15 / React 19 / TypeScript strict | App Router SPA |
| Styling | Tailwind CSS v4 | no component library dependency |

---

## Current release

**v0.0.3** — User identity + run history. Full history: [docs/CHANGELOG.md](docs/CHANGELOG.md)
