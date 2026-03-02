# v0.0.1-pre — AI Detection (End-to-End)

**Status:** PRE-RELEASE (spec ready for implementation)

---

## Overview

Deliver a working end-to-end AI detection feature: paste text, get a humanness score 0–100. This is the first functional slice of the judge agent — scoped to AI vs. human origin detection only. Virality scoring, distribution analysis, audience segmentation, and transcript ingestion are deferred to v0.0.2.

---

## Goals

1. **Working end-to-end flow** — User pastes text in the frontend, receives an AI detection score from the backend
2. **Simple, focused output** — Humanness score (0–100), top signals, one-paragraph explanation
3. **Eval baseline** — Test fixtures with known AI and human samples, scored against thresholds
4. **Clean API contract** — `POST /judge` with typed request/response

---

## Requirements

### Backend

1. **Simplified output schema** (`backend/app/agents/output.py`):
   - `DetectionOutput(score: int 0-100, signals: list[str], explanation: str)`
   - `score`: 100 = definitely human, 0 = definitely AI
   - `signals`: 1–5 top signals that drove the score
   - `explanation`: one-paragraph reasoning
   - Remove: `JudgeOutput`, `ViralityAnalysis`, `AudienceSegment`, `AudienceReaction`, `OriginPrediction`
   - Keep: `ContentInput`, `ContentType`

2. **Simplified prompt** (`backend/app/agents/prompts/judge_text.txt`):
   - Keep AI detection signal rubric (structural, vocabulary, coherence)
   - Remove virality, distribution, audience sections
   - Instruct: "Return a humanness score 0–100 with top signals and one-paragraph explanation"

3. **Agent update** (`backend/app/agents/judge_agent.py`):
   - Use `DetectionOutput` instead of `JudgeOutput`
   - Correct Agno API usage (structured output via `response_model`)

4. **API endpoint** (`backend/app/api/judge.py`):
   - `POST /judge` accepting `{ "content": "..." }`
   - Returns `DetectionOutput` as JSON
   - Wired into FastAPI via `app.include_router()`

5. **Dependencies** (`backend/pyproject.toml`):
   - Add `agno` and `anthropic` to dependencies

### Frontend

1. **Judge UI** (`frontend/app/page.tsx`):
   - Textarea for text input
   - "Judge" button with loading state
   - Score display: big number, color-coded (red < 30, yellow 30–70, green > 70)
   - Signals as bulleted list
   - Explanation paragraph

2. **Types** (`frontend/app/lib/types.ts`):
   - `JudgeRequest { content: string }`
   - `JudgeResponse { score: number, signals: string[], explanation: string }`

3. **API client** (`frontend/app/lib/api.ts`):
   - `judgeContent(content: string): Promise<JudgeResponse>`

4. **Constants** (`frontend/app/lib/constants.ts`):
   - Add `/judge` endpoint

### Evals

1. **Test fixtures** (`backend/tests/fixtures/`):
   - `ai_samples.json`: 5–10 AI-generated text samples
   - `human_samples.json`: 5–10 human-written text samples
   - Each: `{ "text": "...", "label": "ai"|"human", "source": "..." }`

2. **Eval script** (`backend/tests/eval_detection.py`):
   - Runs judge agent on each sample
   - AI samples should score < 30 (AI-like)
   - Human samples should score > 70 (human-like)
   - Prints summary: sample → score → pass/fail

---

## Acceptance Criteria

- [ ] `POST /judge` accepts `{ "content": "text here" }` and returns `{ "score": 0-100, "signals": [...], "explanation": "..." }`
- [ ] Score range: 0 = definitely AI, 100 = definitely human
- [ ] Frontend: paste text → click Judge → see score + signals + explanation
- [ ] Score display is color-coded: red (< 30), yellow (30–70), green (> 70)
- [ ] Backend starts without import errors (`agno` and `anthropic` in deps)
- [ ] Eval script runs against fixtures; AI samples < 30, human samples > 70
- [ ] `mypy --strict` and `ruff` pass on backend
- [ ] `tsc --strict` and `eslint` pass on frontend
- [ ] All changes committed and pushed to `main`

---

## Out of Scope (deferred to v0.0.2)

- Virality scoring
- Distribution / audience analysis
- Full `JudgeOutput` with origin, virality, distribution, explanation
- Transcript ingestion
- Video analysis
- DBOS workflow integration
- Database persistence of results

---

**Last Updated:** 2026-03-02
**Spec Owner:** judge-agent team
