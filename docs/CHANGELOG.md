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
- (Active work will be listed here as v0.0.2-pre development begins)

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
