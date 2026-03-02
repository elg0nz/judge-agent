# v0.0.7 — Visual Frame Report + Feedback (Thumbs Up/Down)

**Status:** Pre-release spec
**Builds on:** v0.0.6 (video pipeline)

---

## Overview

After video analysis, the UI shows a visual report of the extracted frames so the reviewer can eyeball quality. Both text and video results get a thumbs up/down feedback row. Feedback is stored in SQLite for future eval loop seeding (v0.0.8). The frame report is visual QA only — no analysis is performed on the frames here (that was done in v0.0.6).

---

## Goals

1. Reviewers can visually inspect extracted frames after video analysis
2. Users can rate any analysis result (text or video) with thumbs up/down
3. Feedback is stored in a clean schema ready for eval fixture generation
4. One rating per result, no editing

---

## Requirements

### Visual Frame Report

After video analysis completes, the UI shows a **Frame Report** section below the judge output:

- Display a random sample of **6–9 extracted frames** from `./tmp/{upload_id}/frames/`
- Label each frame with its type: **scene** (sc_), **uniform** (uni_), **keyframe** (i_)
- This is visual QA, not analysis — do NOT pass frames to the judge here

**Backend:**

**`GET /frames/{upload_id}`** — returns a list of frame metadata:
```json
[
  { "path": "/frames/{upload_id}/sc_000001.jpg", "type": "scene" },
  { "path": "/frames/{upload_id}/uni_000001.jpg", "type": "uniform" },
  { "path": "/frames/{upload_id}/i_000001.jpg", "type": "keyframe" }
]
```

Also serve the frame images via a static file mount or dedicated endpoint.

### Thumbs Up/Down Feedback

Both text and video judge results show a feedback row:

> Was this analysis accurate? [thumbs up] [thumbs down]

**`POST /feedback`** — accepts:
```json
{
  "judge_request_id": "...",
  "rating": "up" | "down",
  "content_type": "text" | "video"
}
```

**Data Model — `Feedback` table** (`feedback`):
| Column | Type | Notes |
|--------|------|-------|
| `id` | `INTEGER` PK AUTOINCREMENT | |
| `judge_request_id` | `VARCHAR(32)` FK → `judge_runs.id` | |
| `rating` | `VARCHAR(4)` NOT NULL | "up" or "down" |
| `content_type` | `VARCHAR(5)` NOT NULL | "text" or "video" |
| `created_at` | `DateTime` | auto |

UNIQUE constraint on `judge_request_id` — one rating per result.

**Frontend UI after submission:**
- Replace thumbs with: "Thanks — this helps us improve."
- No undo, no edit

### File Layout

```
backend/app/
├── db/
│   └── models.py          # Add Feedback model
├── api/
│   ├── feedback.py        # NEW: POST /feedback
│   └── frames.py          # NEW: GET /frames/{upload_id}
└── main.py                # Register feedback + frames routers

frontend/app/
├── page.tsx               # Add frame report section + feedback row
└── lib/
    ├── types.ts           # Add FrameInfo, FeedbackRequest types
    └── api.ts             # Add getFrames(), submitFeedback() functions
```

---

## Implementation Approach

- Frame report: `GET /frames/{upload_id}` lists files in the frames directory, classifies by prefix
- Serve frame images via FastAPI `StaticFiles` mount on `/tmp` or a streaming endpoint
- Feedback: new model + simple POST endpoint with unique constraint on `judge_request_id`
- Frontend: add `FrameReport` component (grid of thumbnails with labels), `FeedbackRow` component (two buttons + thank-you state)

---

## Acceptance Criteria

- [ ] Video results show 6–9 frame thumbnails with type labels (scene/uniform/keyframe)
- [ ] Text and video results both show thumbs up/down feedback row
- [ ] Clicking either thumb stores feedback in DB via `POST /feedback`
- [ ] UI confirms after submission ("Thanks — this helps us improve."), disables re-rating
- [ ] `GET /frames/{upload_id}` returns frame list with type labels
- [ ] `Feedback` model added to `models.py` with UNIQUE on `judge_request_id`
- [ ] One rating per result enforced (duplicate POST returns error or is idempotent)
- [ ] Frame images are servable from the backend (static mount or endpoint)

---

## Notes

- The frame report is visual QA, NOT analysis — do not pass frames to the judge in v0.0.7
- Frame analysis was already done in v0.0.6 (judge_video_workflow step C)
- The feedback table is the seed of a future eval loop — keep the schema clean

---

**Author:** Claude Code
**Created:** 2026-03-02
