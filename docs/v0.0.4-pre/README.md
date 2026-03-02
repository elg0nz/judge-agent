# v0.0.4 — Fix the Lies + ElevenLabs Wiring

**Status:** Pre-release spec
**Builds on:** v0.0.3 (user identity + run history)

---

## Overview

The README and GETTING_STARTED currently show a v0.0.1-era response shape (`{ score, signals, explanation }`) but the actual v0.0.2+ API returns `{ origin, virality, distribution, explanation }`. This version fixes all public-facing documentation to match reality, updates the FastAPI metadata, and wires ElevenLabs config for future video mode (v0.0.6).

---

## Goals

1. All documentation accurately describes the current API response shape
2. ElevenLabs API key wired into config, .env.example, and READMEs — ready for v0.0.6 transcription
3. FastAPI `/docs` title/description reflects what the app actually does
4. Zero functional changes — server boots, `POST /judge` still works identically

---

## Requirements

### 1. Fix Documentation

**`README.md`** (root):
- Update the API section to show the correct response schema:
  ```json
  {
    "origin": { "prediction": "AI-generated", "confidence": 0.9, "signals": ["..."] },
    "virality": { "score": 25, "drivers": ["..."] },
    "distribution": [{ "segment": "...", "platforms": ["..."], "reaction": "..." }],
    "explanation": "..."
  }
  ```

**`GETTING_STARTED.md`**:
- Update the curl example and expected response to match actual API shape
- Add ElevenLabs API key to "What you'll need" section:
  - ElevenLabs API key (only required for video mode): console.elevenlabs.io

**`backend/app/main.py`**:
- Change FastAPI `title` and `description` — replace "Judicial reasoning agent powered by DBOS and Agno" with "Agentic system to detect non-human created content"

**`frontend/app/lib/types.ts`**:
- Verify types match actual API shape (should already be correct post-v0.0.2)

### 2. Wire ElevenLabs Config

**`backend/pyproject.toml`**:
- Add `"elevenlabs>=1.0.0"` to dependencies

**`backend/.env.example`**:
- Add `ELEVENLABS_API_KEY=your-elevenlabs-api-key-here`

**`backend/app/core/config.py`**:
- Add `ELEVENLABS_API_KEY: str = ""`

**`backend/README.md`** (under "Environment variables"):
- Add: `ELEVENLABS_API_KEY` — Required for video mode (speech-to-text transcription via ElevenLabs Scribe). Leave blank if only using text mode.

**No actual usage yet** — just wiring. ElevenLabs is used in v0.0.6.

---

## Implementation Approach

- Read each file, find the stale content, replace with correct content
- Install elevenlabs via pyproject.toml, add config field, update .env.example and READMEs
- Boot server, verify `POST /judge` still works

---

## Acceptance Criteria

- [ ] README curl example shows correct `origin`/`virality`/`distribution`/`explanation` shape
- [ ] GETTING_STARTED shows correct expected response
- [ ] FastAPI `/docs` title/description is accurate ("Agentic system to detect non-human created content")
- [ ] `ELEVENLABS_API_KEY` exists in `.env.example`, `config.py`, and both READMEs
- [ ] `elevenlabs>=1.0.0` in pyproject.toml dependencies
- [ ] Server boots, `POST /judge` still works
- [ ] `frontend/app/lib/types.ts` types match actual API response

---

**Author:** Claude Code
**Created:** 2026-03-02
