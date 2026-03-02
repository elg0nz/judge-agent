# v0.0.2-pre — Full Judge Output (Virality + Distribution)

**Status:** PRE-RELEASE (spec placeholder — not yet implemented)

---

## Overview

Expand AI detection into the full judge output: origin prediction, virality scoring, audience distribution analysis, and a unified explanation. This restores the v0.0.0 schema vision (JudgeOutput with 4 outputs) on top of the working v0.0.1 AI detection foundation.

---

## Goals

1. **Virality scoring** — Score content 0–100 relative to average content in its format
2. **Distribution analysis** — Identify 2–4 audience segments by interest graph
3. **Full JudgeOutput** — All four outputs in a single LLM call
4. **Backward compatibility** — `POST /judge` continues to work; add `POST /judge/full` for the expanded output

---

## Deferred from v0.0.1

The following were explicitly removed from v0.0.1 scope and are captured here:

- `JudgeOutput` with `origin`, `virality`, `distribution`, `explanation` fields
- `ViralityAnalysis(score, drivers)` — virality score + structural drivers
- `AudienceSegment(segment, why, platforms, reaction)` — audience distribution
- `OriginPrediction` enum (AI/HUMAN/MIXED)
- `AudienceReaction` enum (SHARE/SAVE/COMMENT/IGNORE)
- Virality scoring prompt sections (hook strength, emotional valence, controversy, format fit)
- Distribution analysis prompt sections (2-4 segments, interest graph, platform indexing)

---

## Requirements (TBD)

To be filled in before implementation begins. Must include:

- Expanded output schema
- Updated prompt with virality + distribution sections
- New API endpoint or expanded existing `/judge`
- Updated frontend to display virality score and audience segments
- Acceptance criteria checklist

---

## Out of Scope for v0.0.2

- Transcript ingestion (text → transcript preprocessing)
- Video analysis
- DBOS workflow integration
- Database persistence

---

**Last Updated:** 2026-03-02
**Spec Owner:** judge-agent team
**Status:** PLACEHOLDER — needs full spec before implementation
