# judge-agent

Given a piece of content — text or video — the system makes a multi-dimensional call: **origin** (AI vs. human, with confidence and signals), **virality** (0–100 with drivers), **distribution** (2–4 audience segments with platforms and predicted reactions), and a prose **explanation**. A single Claude agent produces all four outputs in one structured call so the reasoning is internally consistent across dimensions. The video pipeline adds ElevenLabs transcription and three-pass ffmpeg frame extraction before the same judge runs.

---

## How to run it

**Prerequisites:** Python 3.11+, Node 18+, an Anthropic API key.

```bash
# clone and configure
git clone <repo>
cd judge-agent/backend
cp .env.example .env          # add ANTHROPIC_API_KEY to .env
```

```bash
# Terminal 1 — backend
cd backend
pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Terminal 2 — frontend
cd frontend
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter any username (no password — see assumptions), paste text, click Analyze.

Full walkthrough with expected output and troubleshooting: **[GETTING_STARTED.md](GETTING_STARTED.md)**

---

## Assumptions

- **Single LLM call for all four outputs.** Origin, virality, distribution, and explanation are correlated — if you run four independent agents the answers are internally consistent but don't agree with each other. One call forces cross-dimensional reasoning. The trade-off is you can't independently tune each output type.
- **No auth.** The login screen accepts any username with no password. This is a PoC — user identity exists to associate run history, not to secure anything.
- **Local disk for video.** Uploaded videos and extracted frames are stored in `./tmp/`. Fine for a demo, not for production.
- **SQLite by default.** Zero-config for local development. Switch to PostgreSQL by setting `DATABASE_URL` in `.env` (see GETTING_STARTED.md).
- **ffmpeg must be installed locally.** The video pipeline shells out to ffmpeg. If it's not on your PATH, video analysis will fail.
- **ElevenLabs is optional.** Video without a subtitle file requires `ELEVENLABS_API_KEY`. Without it, the pipeline falls back to a mock transcript.

---

## What I'd improve with more time

**Multi-agent per output type.** Right now one agent produces all four dimensions. The right next step is a specialized agent per output — each with its own prompt, eval suite, and tuning loop. That makes the system observable (if virality scores drift, you know exactly where to look) and fixes the core trade-off made upfront.

Beyond that:
- **Streaming.** Results come back as a single JSON response after the full pipeline completes. Long videos block. The DBOS step model already has the hooks for emitting progress events over WebSocket.
- **Unit tests per module.** The eval harness (`tests/eval_detection.py`) tests end-to-end accuracy against labeled fixtures but there are no unit tests for individual modules.
- **Docker Compose.** Right now you run two processes manually. A single `docker compose up` would be the right developer experience.

Full API reference, project structure, and tech stack: **[IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)**
