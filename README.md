# GloSense an Agent Judge.
## Coding Assignment by Glo Maldonado (sanscourier.ai)


<div>
    <a href="https://www.loom.com/share/bb4dee0974ec491c8b6d327a4d6e079e">
      <p>Introducing Glossense: AI Content Detection System 🚀 - Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/bb4dee0974ec491c8b6d327a4d6e079e">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/bb4dee0974ec491c8b6d327a4d6e079e-fdaab318cd34ed07-full-play.gif#t=0.1">
    </a>
  </div>

Given a piece of content (text or video), my system makes a multi-dimensional call to determine the quality of the content:
	•	Origin — AI vs. human, with confidence + concrete signals (Human written is more likely to be human-engaging and human-liked)
	•	Virality — 0–100, with explicit drivers (Useful to determine if the content works)
	•	Distribution — 2–4 audience segments, platforms, predicted reactions (Useful to determine if the content is relevant to the audience)
	•	Explanation — prose that ties it all together (A comprehensive report of the reasoning behind the decision)

For this assignment, I built an Agnot agent to produce all four outputs in one structured call. One brain. One pass. Internally consistent reasoning across dimensions.

For video, the pipeline adds a process that:
1. Generates a transcript using ElevenLabs transcription
2. Extracts frames using ffmpeg (scene changes, uniform sample, I-frames)
3. Runs the same judge agent on the unified artifact

---

## How to run it

**Prerequisites:** Python 3.11+, Node 18+, an Anthropic API key, and an ElevenLabs API key.

```bash
# clone and configure
git clone <repo>
cd judge-agent/backend
cp .env.example .env          # add ANTHROPIC_API_KEY and ELEVENLABS_API_KEY to .env
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

- **I should minimize the number of calls to the LLM.** I use a single Claude agent to produce all four outputs in one structured call. One brain. One pass. Internally consistent reasoning across dimensions, while keeping cost down.
- **I should not implement auth yet.** I let the login screen accept any username with no password. This is a PoC — I use identity only to associate run history, not to secure anything.
- **It's ok to store video artifacts on local disk.** I store uploaded videos and extracted frames in `./tmp/`. That is fine for a demo, not for production. In prod, I would use shared object storage like S3 and add automatic cleanup.
- **It's fine to default to SQLite.** I chose zero-config local development first. I can switch to PostgreSQL by setting `DATABASE_URL` in `.env` (see GETTING_STARTED.md).
- **I assume ffmpeg is installed locally.** My video pipeline shells out to ffmpeg. If it is not on the PATH, video analysis fails. This is not production-ready and should be replaced with a tighter integration.
- **I treat ElevenLabs as optional.** Video without a subtitle file requires `ELEVENLABS_API_KEY`. Without it, I fall back to a mock transcript. At home I usually run whisper.cpp on a Mac M4, but yours is probably busy with OpenClaw or some other cool project.

---

## What I'd improve with more time

- **Multi-agent per output type.** Right now one agent produces all four dimensions. The right next step is a specialized agent per output — each with its own prompt, eval suite, and tuning loop. That makes the system observable (if virality scores drift, you know exactly where to look) and fixes the core trade-off made upfront. Ideally we would also run all agents in parallel to speed up the process.

Beyond that:
- **Internal Streaming.** I would have the agent emit progress events over WebSocket to update the frontend in real-time, but that's hard to implement correctly given the time constraint.
- **Unit tests per module.** The eval harness (`tests/eval_detection.py`) tests end-to-end accuracy. We should break it down by dimensions (origin, virality, distribution, explanation) and add unit tests & eval harnesses for each module.
- **~~Docker Compose.~~** ~~Right now you run two processes manually. A single `docker compose up` might be sufficient. I might tackle this if I have time before the deadline.~~ Implemented not fully tested.

Full API reference, project structure, and tech stack: **[IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)**

---

> **Note:** For full setup steps, expected output, Docker Compose usage, and troubleshooting, see **[GETTING_STARTED.md](GETTING_STARTED.md)**.
