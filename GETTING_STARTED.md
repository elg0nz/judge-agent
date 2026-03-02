# Getting Started

This guide gets you from a fresh clone to a running system in under 10 minutes.

---

## What you'll need

| Tool | Why | Install |
|------|-----|---------|
| Python 3.11+ | Runs the backend API | [python.org/downloads](https://www.python.org/downloads/) |
| Node.js 18+ | Runs the frontend | [nodejs.org](https://nodejs.org/) |
| Anthropic API key | Powers the AI detection | [console.anthropic.com](https://console.anthropic.com/) |
| ElevenLabs API key | Video mode transcription (optional) | [console.elevenlabs.io](https://console.elevenlabs.io/) |

Check your versions:
```bash
python --version   # must be 3.11 or higher
node --version     # must be 18 or higher
```

---

## Step 1 — Configure the backend

The backend reads its settings from a file called `.env`. One is already set up for you — the only thing you need to add is your API key.

Open `backend/.env` and find this line:
```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Replace `your-anthropic-api-key-here` with your actual key (starts with `sk-ant-`).

That's it. The database is SQLite — a single file that gets created automatically when you start the server. No database setup required.

---

## Step 2 — Install backend dependencies

```bash
cd backend
pip install -e ".[dev]"
```

This installs the backend and all its development tools. `.[dev]` means "this package, plus the dev extras." The `-e` flag means edits to source files take effect immediately without reinstalling.

Expected output: lots of lines, ending with `Successfully installed ...`

---

## Step 3 — Start the backend

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`uvicorn` is the server that runs the FastAPI app. `--reload` means it automatically restarts when you edit files.

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Verify it's working:
```bash
curl http://localhost:8000/health
# {"status":"healthy","environment":"development"}
```

The interactive API docs are at **[http://localhost:8000/docs](http://localhost:8000/docs)** — you can call every endpoint from the browser there.

> **Shortcut:** `bash scripts/dev.sh` does the same thing as the uvicorn command above.

---

## Step 4 — Install frontend dependencies

Open a **new terminal tab** (keep the backend running).

```bash
cd frontend
npm install
```

Expected output: lots of lines, ending with `added N packages`.

---

## Step 5 — Start the frontend

```bash
npm run dev
```

**You should see:**
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
✓ Ready in 2.8s
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser. You'll see the judge interface.

---

## Step 6 — Test the end-to-end flow

Enter a username (first time only), paste any text into the judge UI and click **Analyze**. You'll get:
- **Origin** — AI-generated or human-generated, with confidence score and signals
- **Virality** — score 0–100 with drivers
- **Distribution** — audience segments with platforms and predicted reactions
- **Explanation** — prose analysis

Or test directly from the terminal:
```bash
curl -X POST http://localhost:8000/judge \
  -H "Content-Type: application/json" \
  -d '{"content": "In the rapidly evolving landscape of AI, it is crucial to leverage multifaceted approaches to ensure nuanced outcomes."}'
```

Expected response:
```json
{
  "origin": {
    "prediction": "AI-generated",
    "confidence": 0.92,
    "signals": ["'landscape', 'leverage', 'nuanced' — classic AI vocabulary cluster"]
  },
  "virality": {
    "score": 15,
    "drivers": ["no emotional hook", "generic corporate framing"]
  },
  "distribution": [
    {
      "segment": "LinkedIn professionals",
      "platforms": ["linkedin"],
      "reaction": "ignore"
    },
    {
      "segment": "AI skeptics",
      "platforms": ["twitter", "reddit"],
      "reaction": "comment"
    }
  ],
  "explanation": "The text displays classic AI-generated patterns..."
}
```

---

## Step 7 — Run the evals (optional)

The eval script tests the judge against 10 labeled samples (5 AI-written, 5 human-written) and verifies accuracy thresholds:

```bash
cd backend
python tests/eval_detection.py
```

All 10 should pass. If they don't, check your API key.

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'agno'` or similar**
You skipped or the install failed. Run it again:
```bash
cd backend && pip install -e ".[dev]"
```

**`AuthenticationError` or `Invalid API key`**
Your `ANTHROPIC_API_KEY` in `backend/.env` is wrong or missing. Double-check it starts with `sk-ant-`.

**`Address already in use` on port 8000**
Something else is using that port. Find and stop it:
```bash
lsof -ti:8000 | xargs kill
```

**Frontend shows "Failed to fetch" or network error**
The backend isn't running. Start it first (Step 3), then reload the frontend.

**Frontend is on a different port than 3000**
Update `CORS_ORIGINS` in `backend/.env` to match, then restart the backend.

---

## Using PostgreSQL instead of SQLite

SQLite is fine for local development. If you need PostgreSQL:

1. Install the driver:
   ```bash
   pip install -e ".[postgres]"
   ```
2. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/judge_agent
   ```
3. Create the database and run migrations:
   ```bash
   createdb judge_agent
   alembic upgrade head
   ```
