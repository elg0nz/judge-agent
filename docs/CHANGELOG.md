# Changelog

All notable changes to the judge-agent project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/) (v1.1.0) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Guiding Principles
- **Added:** New features or functionality
- **Changed:** Changes to existing functionality
- **Deprecated:** Soon-to-be removed features (with deprecation period noted)
- **Removed:** Deleted features or code
- **Fixed:** Bug fixes
- **Security:** Security vulnerability fixes

---

## [Unreleased]

### Added
- Attribution: project author (Glo Maldonado / sanscourier.ai) injected into judge system prompt, FastAPI `/docs` title, root API metadata, and Next.js page `<title>`
- Frontend: `GloSense` branding replaces `FeltSense` in header and login screen; sparkles emoji replaces Zap icon
- Frontend: dev-mode disclaimer on login screen explaining no-password PoC behaviour
- Frontend: `APP_ATTRIBUTION` constant drives footer tagline
- Eval: one additional AI-written fixture sample added to `tests/fixtures/ai_samples.json` (human-voice AI text for adversarial coverage)

### Changed
- Frontend branding: app name changed from `FeltSense` to `GloSense` in header, login screen, and footer

---

## [0.0.8] — 2026-03-02

### Added
- `backend/cli/dump_fixtures.py` — internal CLI (`python -m cli.dump_fixtures [--user NAME]`) that reads positive-rated judge runs from the `feedback` table and appends them to `tests/fixtures/ai_samples.json` or `tests/fixtures/human_samples.json` based on `origin.prediction`
- Idempotent by text content — re-running never creates duplicate fixture entries
- Summary line printed to stdout: `Added N AI samples, M human samples.`
- `backend/cli/__init__.py` — proper Python package for the CLI module

---

## [0.0.7] — 2026-03-02

### Added
- `GET /frames/{upload_id}` — returns metadata list of extracted frames (path, type: scene/uniform/keyframe) for a given upload
- Frame images served from the backend via a static file mount; frontend prefixes URLs with `API_BASE_URL` so requests hit the backend rather than Next.js
- `POST /feedback` — stores thumbs-up/down ratings; one rating per judge result enforced by `UNIQUE` constraint on `judge_request_id`
- `Feedback` model (`feedback` table): `id`, `judge_request_id` FK, `rating` ("up"/"down"), `content_type` ("text"/"video"), `created_at`; `CheckConstraint` on `rating` and `content_type` columns
- Frontend: `FrameReport` component displayed below video analysis results, shows 6–9 sampled frames with scene/uniform/keyframe labels
- Frontend: `FeedbackRow` component on all results (text and video) — thumbs up/down buttons; replaced with "Thanks — this helps us improve." after submission; re-rating disabled
- `GET /frames/{upload_id}` and `POST /feedback` routers registered in `main.py`

### Changed
- Judge video prompt (`judge_video.txt`) rewritten to a full forensic media analysis prompt with structured categories: context clues, lighting, texture/materials, faces, edges/artifacts, consistency, and synthetic media markers; previously contained only a brief 8-bullet checklist

### Fixed
- Frame image URLs in the frontend now correctly prefixed with `API_BASE_URL`; previously they resolved against the Next.js origin and returned 404s

---

## [0.0.6] — 2026-03-02

### Added
- `backend/app/agents/video_pipeline.py` — DBOS workflow `judge_video_workflow` that runs transcription and frame extraction as independent durable steps, then calls the judge agent with the combined output
- Transcription step: if subtitle file provided, parse `.srt`/`.vtt` to plain text; otherwise call ElevenLabs Scribe; fall back to mock text in dev if Scribe is unavailable
- Frame extraction step: uses `ffmpeg-python` bindings (not subprocess) to extract three frame sets — scene changes (`sc_`), uniform 2fps sample (`uni_`), and I-frames (`i_`) — into `./tmp/{upload_id}/frames/`
- `POST /judge/video` endpoint accepting `{ upload_id, user_uuid }`, returns standard `JudgeOutput` (same schema as text mode)
- `ffmpeg-python>=0.2.0` added to `backend/pyproject.toml`
- `aiofiles` added to dependencies; upload endpoint now streams files in 1 MiB chunks instead of loading them entirely into RAM

### Fixed
- Upload endpoint streamed video to disk in chunks to prevent per-worker memory spikes on large uploads
- Lifespan startup: added sentinel file (`.sqlite_tables_created`) so `create_all_tables()` DDL runs only once instead of once per uvicorn worker
- Auth signup: wrapped `INSERT` in `try/except IntegrityError` with rollback and re-query to handle concurrent same-username requests that could previously return a 500
- `POST /judge`: validates `user_uuid` exists in DB before attempting insert; returns 404 for unknown UUIDs rather than a raw FK constraint 500; frontend auto-signs out on 404
- MD5 cache key uses null byte separator (`content + "\x00" + user_uuid`) to prevent hash collisions from adjacent string concatenation

---

## [0.0.6-post] — 2026-03-02

Post-release hardening pass (16 P0 bugs and 4 P1 nitpicks fixed in two commits immediately after the v0.0.6 release commit):

### Fixed
- `video_pipeline`: bare `except` clause replaced with `except Exception` + structured logging so ffmpeg errors are not silently swallowed
- `video_pipeline`: workflow function made `async`; all internal calls use `await` instead of `asyncio.run()`, which blocks the FastAPI event loop when called from an async handler
- `video_pipeline`: removed `ThreadPoolExecutor` — DBOS steps cannot checkpoint through a thread pool; steps called sequentially inside the async workflow
- `video_pipeline`: `ffmpeg` and `elevenlabs` imports moved to module top level (were inside function bodies)
- `video_pipeline`: `_parse_subtitles` no longer mutates the loop variable; uses a local stripped copy
- `video_pipeline`: `_find_video` uses `next(..., None)` instead of `list()[0]` (consistent with prior fix; avoids IndexError on empty glob)
- `config` / `upload` / `video_pipeline`: `TMP_DIR` centralised as `Settings.TMP_DIR` instead of being defined independently in two files
- `judge`: null-byte separator added to MD5 hash (`content + "\x00" + user_uuid`) to prevent boundary collision
- `judge`: async video workflow handler correctly `await`s the async DBOS workflow
- `models`: dead `Case` class removed; it was unmapped but still imported, creating a phantom schema artefact
- `models`: `TimestampedMixin` applied to `JudgeRun` to add `updated_at` audit column
- `judge_agent`: prompt assembly uses `list` + `str.join` instead of string concatenation
- `upload`: 500 MiB `MAX_UPLOAD_BYTES` limit enforced before writing to disk
- `upload`: MIME type validated as the primary guard; previously only file extension was checked (easily spoofed)
- `auth`: `None` guard added after `IntegrityError` rollback path to prevent a second crash if re-query still returns nothing
- `config`: `_TolerantEnvSource` comment links to the upstream `uv` / `python-dotenv` parsing bug it works around
- History limit of 50 promoted to a named constant `HISTORY_LIMIT` with explanatory comment
- `DBOS_SYSTEM_DATABASE_URL` added to `.env.example` with its default value documented
- Login falls back to `crypto.randomUUID()` if the backend is unreachable so the UI never blocks on auth
- CORS origins expanded to include `localhost:3001` for when Next.js picks an alternate port

---

## [0.0.5] — 2026-03-02

### Added
- Frontend: mode selector shown after login — two cards ("Text" / "Video") to choose input type before interacting
- Frontend: video file drop area (HTML5 drag-and-drop; no external library) accepts `.mp4`, `.mov`, `.webm` video files and optional `.srt`/`.vtt` subtitle files; displays `upload_id` after successful upload
- `POST /upload` endpoint: saves video to `./tmp/{uuid}/video.{ext}` and optional subtitle to `./tmp/{uuid}/subtitles.{ext}`; returns `{ upload_id, has_subtitles }`
- `backend/app/api/upload.py` registered in `main.py`
- `./tmp/` added to `.gitignore`

---

## [0.0.4] — 2026-03-02

### Added
- `ELEVENLABS_API_KEY` setting wired into `backend/app/core/config.py`, `.env.example`, and both READMEs (required for video mode transcription in v0.0.6; leave blank for text-only mode)
- `elevenlabs>=1.0.0` added to `backend/pyproject.toml` dependencies

### Changed
- `README.md` and `GETTING_STARTED.md` updated with the correct v0.0.2+ API response shape (`origin` / `virality` / `distribution` / `explanation`); previously showed the v0.0.1-era `{ score, signals, explanation }` shape
- FastAPI `title` changed to `"Judge Agent API"` and `description` changed to `"Agentic system to detect non-human created content"` (was `"Judicial reasoning agent powered by DBOS and Agno"`)

---

## [0.0.3] — 2026-03-02

### Added
- `User` model (`users` table): `uuid` PK (server-generated), `username` UNIQUE, `created_at`
- `JudgeRun` model (`judge_runs` table): `id` PK (MD5 hex of `content + "\x00" + user_uuid`), `user_uuid` FK, `input_text`, `output` JSON, `created_at`
- `POST /auth/signup` — idempotent username-only signup; creates user on first call, returns existing user on repeat; 422 on empty or overly long username
- `GET /judge/history?user_uuid=...` — returns last 50 runs for the given user, newest first, as `RunSummary` list (id, input preview, output, created_at)
- Frontend: login screen shown when no `feltsense_user` key in `localStorage`; single username input, "Start" button
- Frontend: `@username` displayed in header with "Switch user" action that clears `localStorage` and reloads
- Frontend: history panel below the Analyze button; loads on mount, prepends after each new run; expandable rows show full 4-section result; empty state message

### Changed
- `POST /judge` request body gains optional `user_uuid`; when provided, caches by MD5 and persists to `judge_runs`; absent `user_uuid` behaves identically to v0.0.2 (no storage)
- `judgeContent()` API call sends `user_uuid` from `localStorage` if available

---

## [0.0.2] — 2026-03-02

### Added
- Full 4-dimension `JudgeOutput` schema: `origin` (prediction + confidence 0–1 + signals), `virality` (score 0–100 + drivers), `distribution` (2–4 named audience segments each with platforms list and reaction), `explanation`
- `@DBOS.workflow()` and `@DBOS.step(retries_allowed=True, max_attempts=3, backoff_rate=2.0)` wrapping the Claude API call — transient failures retry automatically with exponential backoff without re-running the full request
- DBOS launched in FastAPI lifespan; system DB at `sqlite:///dbos_system.db`, configurable via `DBOS_SYSTEM_DATABASE_URL`
- Prompt expanded to four labelled sections guiding the model through origin, virality, distribution, and output; all signals and drivers must be traceable to the content being judged
- Prompt addenda for transcript (`judge_transcript.txt`) and video (`judge_video.txt`) content types
- Frontend: 4-section result card — Origin (prediction badge + confidence bar + signal pills), Virality (large score number + driver chips), Distribution (segment rows with platform list and reaction badge), Analysis prose
- Eval fixtures expanded from 5 to 15 AI samples and 5 to 15 human samples
- Eval harness: concurrent bounded execution with rate-limit backoff; assertions updated to check `origin.prediction` and `origin.confidence > 0.7`
- `dbos>=2.0.0` added to `backend/pyproject.toml`

### Changed
- `POST /judge` response model changed from `DetectionOutput` to `JudgeOutput`; public endpoint (`/judge`) unchanged
- Judge function renamed from `judge_content()` to `run_judge()`

### Removed
- `DetectionOutput` schema (superseded by `JudgeOutput`)

---

## [0.0.1] — 2026-03-02

### Added
- `POST /judge` API endpoint: accepts `{ "content": "..." }`, returns `{ "score": 0–100, "signals": [...], "explanation": "..." }`
- `DetectionOutput` schema: `score` (100 = definitely human, 0 = definitely AI), `signals` (1–5 top signals), `explanation` (one paragraph)
- AI detection prompt (`judge_text.txt`): structural, vocabulary, and coherence signal rubric
- Agno agent wired to Anthropic Claude with `response_model=DetectionOutput` for structured output
- Judge UI redesigned with Tailwind CSS v4 + Inter font; Coda-like SaaS aesthetic:
  - Fixed header with FeltSense branding
  - Monospace textarea with live word count
  - Score gauge with color-coded progress bar (rose < 30, amber 30–70, emerald > 70)
  - Signal pills and analysis prose section
- Eval fixtures: 5 AI-generated samples + 5 human-written samples in `backend/tests/fixtures/`
- Eval script `backend/tests/eval_detection.py`: validates AI samples score < 30, human samples score > 70; prints per-sample pass/fail summary
- SQLite as default database for local development — no setup required
  - `DATABASE_URL` defaults to `sqlite:///./judge_agent.db` in config
  - Connection pool params skipped for SQLite; `check_same_thread=False` passed
  - Tables auto-created on startup when `ENVIRONMENT=development`
  - `render_as_batch=True` in Alembic env for SQLite `ALTER TABLE` compatibility
- `GETTING_STARTED.md` rewritten for junior developers with copy-pasteable commands and expected output after each step
- `backend/README.md` rewritten with setup, environment variables, and troubleshooting sections

### Changed
- `psycopg2-binary` moved to optional `[postgres]` extra; local dev no longer requires a running PostgreSQL instance
- Agent prompt scoped to AI detection only (removed virality, distribution, audience sections present in the initial scaffold)

### Fixed
- Anthropic API key not passed to Agno `Claude()` model; Pydantic Settings does not inject into `os.environ`, so key must be passed explicitly via `api_key=settings.ANTHROPIC_API_KEY`
- Tailwind CSS v4 setup: added `postcss.config.mjs` with `@tailwindcss/postcss`; migrated from `@tailwind` directives to `@import "tailwindcss"`

### Removed
- `JudgeOutput`, `ViralityAnalysis`, `AudienceSegment`, `AudienceReaction`, `OriginPrediction` models from initial scaffold (deferred to v0.0.2)

---

## [0.0.0] — 2026-03-02

### Added
- Root `README.md` with project overview, documentation structure, and quick-start
- `docs/README.md` with complete BARDD (Beads Assisted Requirement Driven Docs) methodology: 6-step workflow, guiding principles, and versioning rules
- `docs/CHANGELOG.md` (this file) in keepachangelog 1.1.0 format
- `docs/v0.0.0/README.md` documenting scaffolding completion with acceptance criteria and Beads issue reference
- `docs/v0.0.1-pre/README.md` placeholder for the first feature specification
- `docs/v0.0.0/lightsabers/ai-code-review-python.md` — AI code review prompt for Python/backend; tooling stack: Ruff, Mypy, Bandit, Vulture, Radon, flamegraphs
- `docs/v0.0.0/lightsabers/ai-code-review-react-lightsaber.md` — AI code review prompt for React/TypeScript frontend; tooling stack: ESLint, tsc --strict, knip, bundle analysis, React DevTools Profiler
- `CLAUDE.md` with BARDD methodology summary, key commands, and development workflow for AI coding assistants
- `AGENTS.md` with session completion protocol (mandatory git push workflow)
- Beads issue tracking database (`.beads/`) with initial issue for scaffolding work

---

**Legend:** `[version]` = released; entries without a docs folder = shipped but spec folder not yet renamed from `-pre`
