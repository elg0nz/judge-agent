# v0.0.2 — Full Judge Schema + DBOS Durable Execution

**Status:** Pre-release spec
**Supersedes:** v0.0.1 (AI detection only)

---

## Overview

v0.0.1 shipped a single-dimension output: a humanness score with signals and explanation. The assignment requires four dimensions of judgment: **origin** (AI vs. human), **virality** (shareability score), **distribution** (audience segment breakdown), and **explanation** (traceable cross-cutting reasoning).

This version also wires in **DBOS durable execution** so Claude API failures are automatically retried — no lost judgments on transient network errors or rate limits.

---

## Goals

1. Output schema covers all four required dimensions (origin, virality, distribution, explanation)
2. Claude API calls are durable — failures retry automatically up to 3 times with exponential backoff
3. Frontend renders all four sections with appropriate visual treatment
4. Evals validate the new schema and pass at ≥ 80% accuracy

---

## Requirements

### Output Schema

- `origin`: prediction ("AI-generated" | "human-generated"), confidence (0.0–1.0), signals (1–3 items)
- `virality`: score (0–100 integer, relative to average content), drivers (1–5 factors)
- `distribution`: list of 2–4 audience segments, each with segment name, platforms list, and reaction ("share" | "save" | "comment" | "ignore")
- `explanation`: one paragraph of traceable reasoning across all four dimensions
- `DetectionOutput` is removed; `ContentInput` and `ContentType` are unchanged

### Prompt

- Four clearly labelled sections guiding Claude through each dimension
- Strict JSON output block matching the schema above
- All signals and drivers must be traceable to the specific content being judged

### DBOS Durable Execution

- `dbos>=2.0.0` added as a core dependency
- Claude API call wrapped in `@DBOS.step(retries_allowed=True, max_attempts=3, backoff_rate=2.0, interval_seconds=1.0)`
- Orchestration wrapped in `@DBOS.workflow()`
- DBOS initialized and launched in FastAPI lifespan before `yield`
- System DB stored at `sqlite:///dbos_system.db` (separate from app DB), configurable via `DBOS_SYSTEM_DATABASE_URL`

### API

- `POST /judge` returns `JudgeOutput` (all four fields)
- Response model updated; function call updated to `run_judge()`

### Frontend

- Four result sections: Origin card, Virality card, Distribution card, Explanation
- Origin: prediction badge + confidence progress bar + signal pills
- Virality: large score number + driver chips
- Distribution: table of segment rows with platforms and reaction badge
- Explanation: prose paragraph (unchanged position)

### Evals

- Assertions updated from `result.score` to `result.origin.confidence`
- AI samples: `confidence > 0.7` where prediction == "AI-generated"
- Human samples: `confidence > 0.7` where prediction == "human-generated"

---

## Implementation Approach

Single Agno agent, single LLM call per content item — same architecture as v0.0.1. DBOS wraps the Claude call at the `@step` level so retries are durable and idempotent. The workflow decorator enables future orchestration of multi-step pipelines (transcript preprocessing, video frame extraction) without changing the public API.

All four output dimensions are produced in one prompt/response round-trip; no chaining required.

---

## Acceptance Criteria

- [ ] `docs/v0.0.2-pre/README.md` exists and is complete (this file)
- [ ] `backend/app/agents/output.py` exports `JudgeOutput`, `OriginOutput`, `ViralityOutput`, `DistributionSegment`; `DetectionOutput` is removed
- [ ] `backend/app/agents/prompts/judge_text.txt` produces all four fields
- [ ] `backend/pyproject.toml` includes `dbos>=2.0.0`
- [ ] `backend/app/core/config.py` has `DBOS_SYSTEM_DATABASE_URL` setting
- [ ] `backend/app/agents/judge_agent.py` uses `@DBOS.step` + `@DBOS.workflow`; exports `run_judge()`
- [ ] `backend/app/main.py` initializes and launches DBOS in lifespan
- [ ] `backend/app/api/judge.py` uses `JudgeOutput` response model and calls `run_judge()`
- [ ] `frontend/app/lib/types.ts` defines new `JudgeResponse` with all four fields
- [ ] `frontend/app/page.tsx` renders four sections
- [ ] `backend/tests/eval_detection.py` assertions use `result.origin.confidence`; evals pass ≥ 80%
- [ ] `uv run mypy app/` and `uv run ruff check app/` pass clean
- [ ] Server starts without error; `POST /judge` returns valid JSON with all four fields

---

**Author:** Claude Code
**Created:** 2026-03-02
