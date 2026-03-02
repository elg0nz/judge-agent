# v0.0.5 — Video/Text Mode Toggle + File Drop UI

**Status:** Pre-release spec
**Builds on:** v0.0.4 (docs fix + ElevenLabs wiring)

---

## Overview

The UI currently assumes all input is text. v0.0.5 adds a mode selector ("What do you want to analyze?") so the user picks Text or Video before interacting. Text mode is unchanged. Video mode shows a drag-and-drop file upload area. A new `POST /upload` endpoint saves files to `./tmp/{uuid}/` in dev mode. The upload is not wired to the judge yet — that's v0.0.6.

---

## Goals

1. UI knows whether the user is analyzing text or video before they do anything
2. Video file upload works end-to-end (file saved to disk, upload_id returned)
3. Subtitle file support: user can drop .srt/.vtt alongside video
4. Text mode is completely unchanged

---

## Requirements

### Frontend — Mode Selector

On load (after login), the UI asks: **"What do you want to analyze?"**

Two options, visually distinct (not a dropdown — use cards or large buttons):
- **Text** — paste or type content directly
- **Video** — upload a video file

Selecting Text → existing text input flow, no change.
Selecting Video → show the file drop area.

### Frontend — Video File Drop Area

A drag-and-drop zone that accepts:
- Video files: `.mp4`, `.mov`, `.webm`
- Subtitle files: `.srt`, `.vtt`, `.txt`

Include this note in the UI (verbatim):
> Dev mode: files stored in `./tmp/`. Production will use S3.

Below the drop zone, a secondary note:
> Drop a subtitle file (.srt, .vtt) and we'll use it directly.
> No subtitle file? We'll generate one automatically using ElevenLabs.

On file drop: call `POST /upload` with multipart form data. Display the returned `upload_id`.

### Backend — File Upload Endpoint

**`POST /upload`** — accepts `multipart/form-data`:
- `video_file`: required, the video file
- `subtitle_file`: optional, `.srt` or `.vtt`

Behavior:
1. Generate a UUID for this upload
2. Create `./tmp/{uuid}/` directory
3. Save video as `./tmp/{uuid}/video.{ext}`
4. If subtitle provided, save as `./tmp/{uuid}/subtitles.{ext}`

Response:
```json
{ "upload_id": "uuid-string", "has_subtitles": true }
```

### Housekeeping

- Add `./tmp/` to `.gitignore`
- Do NOT wire upload to judge — that's v0.0.6

### File Layout

```
backend/app/
├── api/
│   ├── upload.py          # NEW: POST /upload
│   └── ...existing...
└── main.py                # Register upload router

frontend/app/
├── page.tsx               # Add mode selector + file drop UI
└── lib/
    ├── types.ts           # Add UploadResponse type
    └── api.ts             # Add uploadFile() function
```

---

## Implementation Approach

- Frontend: add mode state to the SPA, conditionally render text input or file drop
- File drop: use native HTML5 drag-and-drop (no extra library needed)
- Backend: new `/upload` router with `UploadFile` params, save to `./tmp/{uuid}/`
- Keep it simple — no S3, no cloud storage, just local disk in dev

---

## Acceptance Criteria

- [ ] UI shows mode selector on load (after login)
- [ ] Text mode works exactly as before (no regressions)
- [ ] Video mode shows file drop area with both notes (dev mode + subtitle)
- [ ] `POST /upload` saves files to `./tmp/{uuid}/`
- [ ] Upload returns `{ upload_id, has_subtitles }`
- [ ] `./tmp/` is in `.gitignore`
- [ ] Subtitle file is optional — upload works with video only
- [ ] Frontend displays upload_id after successful upload

---

**Author:** Claude Code
**Created:** 2026-03-02
