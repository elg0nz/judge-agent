# v0.0.3 — User Identity + Run History

**Status:** Pre-release spec
**Builds on:** v0.0.2 (full judge schema + DBOS)

---

## Overview

Every judge run is ephemeral today — paste, analyze, refresh, gone. v0.0.3 adds the simplest possible user layer: enter a username, get a UUID, and every run you make is stored and browsable. No passwords, no email, no OAuth — just a username and a UUID. This is a take-home assignment, not a auth system.

Deduplication is a free side-effect: `md5(content + user_uuid)` is the run key, so running the same text twice returns the cached result instantly without hitting Claude.

---

## Goals

1. User can sign up with just a username — one field, one button
2. Every judge run is persisted in SQLite and associated with the user
3. Users see their run history in the UI
4. Identical inputs from the same user return cached results (no redundant Claude calls)

---

## Requirements

### Data Model

**`User` table** (`users`):
| Column | Type | Notes |
|--------|------|-------|
| `uuid` | `VARCHAR(36)` PK | Generated server-side (`str(uuid4())`) |
| `username` | `VARCHAR(64)` UNIQUE NOT NULL | |
| `created_at` | `DateTime` | auto |

**`JudgeRun` table** (`judge_runs`):
| Column | Type | Notes |
|--------|------|-------|
| `id` | `VARCHAR(32)` PK | `md5(input_text + user_uuid)` hex digest |
| `user_uuid` | `VARCHAR(36)` FK → `users.uuid` | |
| `input_text` | `TEXT` NOT NULL | |
| `output` | `JSON` NOT NULL | Serialized `JudgeOutput` |
| `created_at` | `DateTime` | auto |

No `updated_at` on `JudgeRun` — runs are immutable once stored.

### Backend API

**`POST /auth/signup`**
- Request: `{ "username": "alice" }`
- Behavior: idempotent — creates user if not exists, returns existing user if username taken
- Response: `{ "username": "alice", "uuid": "..." }`
- Error 422 if username is empty or > 64 chars

**`POST /judge`** (updated)
- Request body: `{ "content": "...", "user_uuid": "..." }` (`user_uuid` optional)
- If `user_uuid` provided: compute `run_id = md5(content + user_uuid)`. If `run_id` exists in DB, return cached `JudgeOutput` immediately. Otherwise run Claude, persist, return.
- If no `user_uuid`: behaves as v0.0.2 (no storage)
- Response: `JudgeOutput` (unchanged schema)

**`GET /judge/history`**
- Query param: `?user_uuid=...` (required)
- Returns list of past runs for that user, newest first
- Response: `list[RunSummary]` where `RunSummary = { id, input_preview (first 120 chars), output, created_at }`

### File Layout

```
backend/app/
├── db/
│   ├── models.py          # Add User + JudgeRun models
│   └── dbos.py            # unchanged
├── api/
│   ├── auth.py            # NEW: POST /auth/signup
│   └── judge.py           # Updated: accept user_uuid, store run, add GET /history
├── agents/
│   └── judge_agent.py     # unchanged
└── main.py                # Register auth router
```

### Frontend

**Login screen** (shown when no `user` in localStorage):
- Centered card, single input "Username", "Start" button
- On submit: `POST /auth/signup` → store `{username, uuid}` in `localStorage["feltsense_user"]`
- Redirect to main judge UI

**Main UI changes**:
- Header: show `@username` on the right (replaces "Content Intelligence" label), clicking it shows "Switch user" which clears localStorage and reloads
- After a successful judge run: prepend to history list
- History panel below the Analyze button:
  - Title: "Your runs" with count badge
  - Each row: `created_at` (relative time), input preview truncated to 80 chars, origin prediction badge
  - Click row → expand inline to show full `JudgeOutput` (same 4-section layout)
  - Empty state: "No runs yet. Paste something above."

**`judgeContent` API call** updated: include `user_uuid` from localStorage if present.

**New `signup` API call**: `POST /auth/signup`.

**New `getHistory` API call**: `GET /judge/history?user_uuid=...`.

### No Migration System for Dev

`create_all_tables()` in the lifespan handler already creates all tables on startup in dev. New models just need to be imported in `models.py` so `Base.metadata` includes them.

---

## Implementation Approach

- `User` and `JudgeRun` are pure SQLAlchemy mapped classes added to `models.py`
- Auth router is 20 lines: lookup-or-create, return `{username, uuid}`
- Judge route gains: optional `user_uuid` in request body, md5 lookup before Claude call, persist after
- History route is a simple `db.query(JudgeRun).filter_by(user_uuid=...).order_by(desc).limit(50)`
- Frontend: localStorage is the "session" — no cookies, no tokens, no middleware

---

## Acceptance Criteria

- [ ] `docs/v0.0.3-pre/README.md` exists and is complete (this file)
- [ ] `User` and `JudgeRun` SQLAlchemy models added to `backend/app/db/models.py`
- [ ] `POST /auth/signup` — idempotent username→uuid creation, 422 on bad input
- [ ] `POST /judge` — caches by `md5(content+user_uuid)` when `user_uuid` provided; falls back to no-cache without it
- [ ] `GET /judge/history` — returns runs for a user, newest first
- [ ] `auth` router registered in `main.py`
- [ ] Frontend: login screen shown when no localStorage user
- [ ] Frontend: `@username` in header with "Switch user"
- [ ] Frontend: history panel below analyze button, runs load on mount
- [ ] Frontend: `judgeContent` sends `user_uuid` if available
- [ ] `uv run ruff check app/` and `uv run mypy app/` pass clean (or no regressions)

---

**Author:** Claude Code
**Created:** 2026-03-02
