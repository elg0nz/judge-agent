# Judge Agent — Backend

Python/FastAPI backend for judge-agent. Accepts text or video, runs it through the AI detection pipeline, and returns origin prediction, virality score, audience distribution, and explanation.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| pip | bundled with Python |

Check:
```bash
python --version
# Python 3.11.x or higher
```

SQLite is the default database — it is built into Python. No database server to install.

---

## Setup

### 1. Create your .env file

```bash
cd backend
cp .env.example .env
```

Open `.env` and set at minimum:

```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

Everything else has a working default for local development. Leave `DATABASE_URL` as-is for SQLite.

Full list of variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | (empty) | Powers the AI judge agent. Get one at [console.anthropic.com](https://console.anthropic.com/). |
| `ELEVENLABS_API_KEY` | Video mode only | (empty) | Transcribes video audio via ElevenLabs Scribe. Leave blank if you only use text mode. |
| `DATABASE_URL` | No | `sqlite:///./judge_agent.db` | SQLite for local dev. Switch to `postgresql://user:pass@host:5432/dbname` for production. |
| `DBOS_SYSTEM_DATABASE_URL` | No | `sqlite:///dbos_system.db` | Internal database for DBOS (the durable execution layer). Default SQLite is fine locally. |
| `ENVIRONMENT` | No | `development` | Controls auto-table-creation and debug behavior. Values: `development`, `testing`, `production`. |
| `CORS_ORIGINS` | No | `["http://localhost:3000","http://localhost:8000"]` | Comma-separated list of allowed frontend origins. |
| `SECRET_KEY` | No | (dev default) | Change this in production. The app will refuse to start in production with the default value. |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity. |

### 2. Install dependencies

```bash
pip install -e ".[dev]"
```

`-e` means "editable install" — edits to source files take effect immediately without reinstalling. `[dev]` adds testing and linting tools.

Expected output ends with:
```
Successfully installed judge-agent-backend-0.0.4 ...
```

### 3. Start the server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the shortcut script:
```bash
bash scripts/dev.sh
```

Both do the same thing. Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [...]
INFO:     Application startup complete.
```

The first startup creates `judge_agent.db` (SQLite) and `dbos_system.db` in `backend/`. These are auto-created on every fresh clone — no migration step needed for SQLite.

### 4. Verify

```bash
curl http://localhost:8000/health
```

Expected:
```json
{"status":"healthy","environment":"development"}
```

Interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Endpoints

### Analyze text

```bash
curl -X POST http://localhost:8000/judge \
  -H "Content-Type: application/json" \
  -d '{"content": "In the rapidly evolving landscape of AI, it is crucial to leverage nuanced approaches."}'
```

Response:
```json
{
  "origin": {
    "prediction": "AI-generated",
    "confidence": 0.92,
    "signals": ["'landscape', 'leverage', 'nuanced' vocabulary cluster"]
  },
  "virality": { "score": 12, "drivers": ["no emotional hook", "generic framing"] },
  "distribution": [
    { "segment": "LinkedIn professionals", "platforms": ["linkedin"], "reaction": "ignore" }
  ],
  "explanation": "The text displays classic AI-generated patterns..."
}
```

### Create / retrieve user

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}'
```

Response:
```json
{"username": "alice", "uuid": "550e8400-e29b-41d4-a716-446655440000"}
```

Calling this again with the same username returns the existing user — it is idempotent.

### Run history

```bash
curl "http://localhost:8000/judge/history?user_uuid=550e8400-e29b-41d4-a716-446655440000"
```

Returns the last 50 runs for that user, newest first.

### Health check

```bash
curl http://localhost:8000/health
# {"status":"healthy","environment":"development"}
```

---

## Project structure

```
backend/
├── app/
│   ├── main.py                  — FastAPI app setup, middleware, lifespan
│   ├── core/
│   │   └── config.py            — Pydantic Settings (reads from .env)
│   ├── db/
│   │   ├── models.py            — SQLAlchemy ORM models (User, JudgeRun, Feedback)
│   │   └── dbos.py              — DB session management
│   ├── api/
│   │   ├── judge.py             — POST /judge, GET /judge/history, POST /judge/video
│   │   ├── auth.py              — POST /auth/signup
│   │   ├── upload.py            — POST /upload
│   │   ├── feedback.py          — POST /feedback
│   │   └── frames.py            — GET /frames/{upload_id}
│   └── agents/
│       ├── judge_agent.py       — Main judge agent (Agno + Claude, DBOS retry)
│       ├── output.py            — JudgeOutput Pydantic schema
│       ├── video_pipeline.py    — Video transcription + analysis pipeline
│       └── prompts/             — System prompt text files
├── tests/
│   ├── eval_detection.py        — Accuracy eval against labeled samples
│   └── fixtures/                — ai_samples.json, human_samples.json
├── scripts/
│   ├── dev.sh                   — Start the dev server
│   └── presubmit.sh             — Run all quality gates
├── alembic/                     — Database migrations (for PostgreSQL)
├── .env.example                 — Environment template
└── pyproject.toml               — Dependencies, tool config
```

---

## Running the eval

The eval tests the judge against labeled samples and verifies accuracy:

```bash
cd backend
python tests/eval_detection.py
```

All samples should pass. If they fail, check your `ANTHROPIC_API_KEY`.

---

## Development

### Quality gates

Run before committing:

```bash
cd backend
bash scripts/presubmit.sh
```

Runs: mypy (type checking), ruff (linting), bandit (security), vulture (dead code), pytest.

Individual commands:

```bash
mypy app --strict               # type check
ruff check app                  # lint
pytest tests -v                 # unit tests
pytest tests --cov=app          # tests with coverage
```

---

## PostgreSQL (production)

SQLite is the default and works for local dev. To use PostgreSQL:

1. Install the driver:
   ```bash
   pip install -e ".[postgres]"
   ```

2. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/judge_agent
   ```

3. Create the database and apply migrations:
   ```bash
   createdb judge_agent
   alembic upgrade head
   ```

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'fastapi'` or similar**

Install failed or you're in the wrong directory.
```bash
cd backend
pip install -e ".[dev]"
```

**`AuthenticationError: Error code: 401` from Anthropic**

Your `ANTHROPIC_API_KEY` in `backend/.env` is missing or wrong. It must start with `sk-ant-`.

**`Address already in use` on port 8000**

Something else is on that port. Kill it:
```bash
lsof -ti:8000 | xargs kill
```

**`[Errno 2] No such file or directory: '.env'`**

You skipped the copy step:
```bash
cd backend && cp .env.example .env
```
Then add your API key.

**Server starts but `POST /judge` returns 500**

Almost always a bad or missing `ANTHROPIC_API_KEY`. Check the server logs in the terminal where uvicorn is running.
