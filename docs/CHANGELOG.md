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

---

## [0.0.3] — 2026-03-02

### Added
- `POST /auth/signup` — idempotent username-only signup (username → UUID)
- `User` model (uuid PK, unique username) and `JudgeRun` model (md5 PK, input_text, output JSON)
- `GET /judge/history` — returns last 50 runs per user, newest first
- Deduplication: `md5(content + user_uuid)` cache key on `POST /judge` — same input returns cached result
- Frontend: login screen (single username field, localStorage session)
- Frontend: `@username` header with "Switch user" (clears localStorage)
- Frontend: history panel below analyze button with expandable run rows

### Changed
- `POST /judge` now accepts optional `user_uuid` — if provided, persists and caches runs

---

## [0.0.2] — 2026-03-02

### Added
- Full 4-dimension `JudgeOutput` schema: `origin` (prediction + confidence + signals), `virality` (score + drivers), `distribution` (2–4 segments with platforms and reactions), `explanation`
- DBOS durable execution: `@DBOS.workflow()` and `@DBOS.step(retries_allowed=True)` with 3-attempt exponential backoff
- 4-section prompt: origin (structural/vocab/coherence), virality (hook/emotion/controversy), distribution (named segments), output (strict JSON)
- Prompt addenda for transcript and video content types (`judge_transcript.txt`, `judge_video.txt`)
- Frontend: 4-section result card (Origin badge, Virality gauge, Distribution cards, Analysis prose)
- Eval fixtures expanded to 15 AI + 15 human samples
- Eval harness: concurrent bounded execution with rate-limit backoff

### Changed
- Replaced `DetectionOutput` (score/signals/explanation) with full `JudgeOutput` (origin/virality/distribution/explanation)
- Agent prompt expanded from detection-only to full 4-dimension analysis

### Removed
- `DetectionOutput` model (superseded by `JudgeOutput`)

---

## [0.0.1] — 2026-03-02

### Added
- `POST /judge` API endpoint: accepts `{ content }`, returns `{ score, signals, explanation }`
- `DetectionOutput` schema: humanness score 0–100 (100=human, 0=AI), top signals, explanation
- AI detection prompt: structural, vocabulary, and coherence signal rubric
- Judge UI: redesigned with Tailwind CSS v4 + Inter font; Coda-like SaaS aesthetic
  - Fixed header with FeltSense logo
  - Monospace textarea with live word count
  - Score gauge with color-coded progress bar (rose/amber/emerald)
  - Signal pills and analysis prose section
- Eval fixtures: 5 AI samples + 5 human samples in `backend/tests/fixtures/`
- Eval script `backend/tests/eval_detection.py`: validates AI < 30, human > 70
- SQLite as default database for local development (no setup required)
  - Auto-creates tables on startup when `ENVIRONMENT=development`
  - PostgreSQL available via `pip install -e ".[postgres]"` + `DATABASE_URL` override
- `GETTING_STARTED.md` and `backend/README.md` rewritten for junior developers

### Changed
- Replaced broad `JudgeOutput` (origin, virality, distribution, explanation) with focused `DetectionOutput`
- Simplified agent prompt to AI detection only (removed virality and distribution analysis)
- `psycopg2-binary` moved to optional `[postgres]` extra; not required for local dev
- Alembic: `render_as_batch=True` for SQLite ALTER TABLE compatibility

### Fixed
- Anthropic API key not passed to Agno `Claude()` model; Pydantic Settings does not inject into `os.environ`, so key must be passed explicitly via `api_key=settings.ANTHROPIC_API_KEY`
- Tailwind CSS v4 setup: added `postcss.config.mjs` with `@tailwindcss/postcss`; migrated from `@tailwind` directives to `@import "tailwindcss"`

### Removed
- `JudgeOutput`, `ViralityAnalysis`, `AudienceSegment`, `AudienceReaction`, `OriginPrediction` models (deferred to v0.0.2)

---

## [0.0.0] — 2026-03-02

### Added
- Root `README.md` with project overview and documentation structure
- `docs/README.md` with complete BARDD methodology, 6-step workflow, and guiding principles
- `docs/CHANGELOG.md` (this file) in keepachangelog 1.1.0 format
- `docs/v0.0.0/README.md` documenting BARDD scaffolding completion
- `docs/v0.0.1-pre/README.md` as placeholder for first feature specification
- Foundation for requirements-driven development workflow with Beads issue tracking

---

**Legend:** `[version]` = released; `[version-pre]` = pre-release spec (not yet implemented)
