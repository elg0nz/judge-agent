# v0.0.8 — Fixtures CLI (Internal Tool)

**Status:** Pre-release spec
**Builds on:** v0.0.7 (feedback collection)

---

## Overview

Internal CLI tool that turns user feedback (thumbs-up ratings from v0.0.7) into eval fixtures. Only `rating=up` entries are exported — the user is saying "yes, this analysis was correct." Fixtures are appended to the existing eval fixture files, enabling the eval harness to grow its dataset from real production judgments.

---

## Goals

1. One command dumps positive-rated judge results into eval fixtures
2. Fixtures are correctly classified by `origin.prediction` (AI vs. human)
3. Idempotent — running twice doesn't create duplicates
4. Existing eval script (`tests/eval_detection.py`) works against updated fixtures without modification

---

## Requirements

### CLI Command

```bash
cd backend
python -m cli.dump_fixtures --user glo
```

**Behavior:**
1. Query `feedback` table for all `rating=up` entries for the given user (join through `judge_runs` → `users`)
2. For each: fetch the original `input_text` + `output` (JSON) from `judge_runs`
3. Parse `output.origin.prediction` to determine classification
4. Append to the appropriate fixture file:
   - `"AI-generated"` → `tests/fixtures/ai_samples.json`
   - `"human-generated"` → `tests/fixtures/human_samples.json`
5. Print summary: `Added 3 AI samples, 2 human samples.`

**No `--user` flag** = dump all users.

### Fixture Format

Must match existing eval script expectations:
```json
[
  {
    "text": "the original input text",
    "source": "user:glo",
    "expected_prediction": "AI-generated"
  }
]
```

### Idempotency

- Track by `judge_request_id` (the md5 hash from `judge_runs.id`)
- Before appending, check if an entry with the same `text` already exists in the fixture file
- Skip duplicates, only append new entries

### File Layout

```
backend/
├── cli/
│   ├── __init__.py
│   └── dump_fixtures.py   # NEW: CLI entry point
└── tests/
    ├── eval_detection.py  # Unchanged — must still work
    └── fixtures/
        ├── ai_samples.json
        └── human_samples.json
```

---

## Implementation Approach

- Simple `argparse` CLI in `cli/dump_fixtures.py`
- Reuse the existing `DatabaseManager` / `get_db()` for database access
- Load existing fixture file, check for duplicates by text content, append new entries, write back
- No external dependencies — just stdlib + SQLAlchemy (already installed)

---

## Acceptance Criteria

- [ ] `python -m cli.dump_fixtures --user glo` runs without error
- [ ] Fixtures appended correctly to the right file based on `origin.prediction`
- [ ] Duplicate entries not added (idempotent by text content / `judge_request_id`)
- [ ] Summary printed to stdout: "Added N AI samples, M human samples."
- [ ] `python tests/eval_detection.py` still runs against updated fixtures
- [ ] No `--user` flag dumps all users' positive feedback
- [ ] `cli/__init__.py` exists (proper Python package)

---

## Notes

- Only `rating=up` entries become fixtures — user is confirming "this analysis was correct"
- The `source` field format is `user:{username}` to distinguish from hand-curated fixtures
- Keep the fixture files sorted or at least consistent — don't shuffle existing entries
- This is an internal tool, not a user-facing feature

---

**Author:** Claude Code
**Created:** 2026-03-02
