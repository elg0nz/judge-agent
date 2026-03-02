# v0.0.6 — Video Pipeline: Transcription + Frame Extraction

**Status:** Pre-release spec
**Builds on:** v0.0.5 (video/text mode toggle + file upload)

---

## Overview

This is the core video analysis pipeline. After a video is uploaded (v0.0.5), two DBOS workflows run in parallel: (A) transcription via ElevenLabs Scribe or subtitle parsing, and (B) frame extraction via ffmpeg-python. When both complete, step (C) runs the existing judge agent with both transcript text and extracted frames. The response is the same `JudgeOutput` schema — no new output fields.

---

## Goals

1. Uploaded videos get transcribed (ElevenLabs Scribe or provided subtitles)
2. Key frames extracted in three modes: scene changes, uniform sample, I-frames
3. Both workflows run concurrently via DBOS, with independent retry
4. Judge agent produces `JudgeOutput` from combined transcript + frames
5. Same response shape as text mode — callers don't need to handle a different schema

---

## Requirements

### Dependencies

**`backend/pyproject.toml`**:
- Add `"ffmpeg-python>=0.2.0"` to dependencies

### Workflow A — Transcription

**If no subtitle file was provided:**
- Use ElevenLabs Scribe: `elevenlabs.client.ElevenLabs().speech_to_text.convert()`
- Input: video file from `./tmp/{upload_id}/video.{ext}`
- Output: save as `./tmp/{upload_id}/transcript.txt`

**If subtitle file was provided:**
- Parse `.srt` or `.vtt` to plain text (strip timestamps, cue IDs)
- Save as `./tmp/{upload_id}/transcript.txt`

**If ElevenLabs Scribe is unavailable (free tier during dev):**
- Mock the transcription step — return placeholder text and note it in code

### Workflow B — Frame Extraction

Uses `ffmpeg-python` bindings (NOT subprocess shell calls). Extract three frame sets into `./tmp/{upload_id}/frames/`:

```python
# Scene changes (content-aware, high value)
ffmpeg.input(video_path).output(
    f"{frames_dir}/sc_%06d.jpg",
    vf="select='gt(scene,0.35)',showinfo",
    vsync="vfr",
    frame_pts=1
).run()

# Uniform 2fps sample (coverage)
ffmpeg.input(video_path).output(
    f"{frames_dir}/uni_%06d.jpg",
    vf="fps=2"
).run()

# I-frames only (keyframes, low noise)
ffmpeg.input(video_path).output(
    f"{frames_dir}/i_%06d.jpg",
    vf="select='eq(pict_type\\,I)'",
    vsync="vfr"
).run()
```

### DBOS Orchestration

**`POST /judge/video`** — accepts `{ "upload_id": "...", "user_uuid": "..." }`:

```
POST /judge/video { upload_id, user_uuid }
  └─ DBOS workflow: judge_video_workflow(upload_id, user_uuid)
       ├─ step A: transcribe_or_parse(upload_id)   → transcript.txt
       ├─ step B: extract_frames(upload_id)         → frames/
       └─ step C: judge_content(transcript, frames) → JudgeOutput
```

- Steps A and B run concurrently (`asyncio.gather`)
- Step C waits for both to complete
- Each step decorated with `@DBOS.step(retries_allowed=True)`
- DBOS retries step A independently if ElevenLabs fails (no re-extraction)
- DBOS retries step B independently if ffmpeg fails (no re-transcription)

### Judge Integration

Step C calls the existing `run_judge()` with `content_type=ContentType.VIDEO`. The video prompt (`judge_video.txt`) already includes instructions for both text and visual signals.

### File Layout

```
backend/app/
├── agents/
│   ├── judge_agent.py     # Add judge_video_workflow, transcribe_or_parse, extract_frames
│   └── prompts/
│       └── judge_video.txt  # Already exists — verify it handles transcript + frames
├── api/
│   ├── judge.py           # Add POST /judge/video endpoint
│   └── upload.py          # Unchanged from v0.0.5
└── main.py                # /judge/video registered via existing judge router
```

---

## Implementation Approach

- Add new DBOS workflow + steps to `judge_agent.py`
- Wire `POST /judge/video` in the judge router
- Use `asyncio.gather` for concurrent step A + B
- Frame extraction uses ffmpeg-python (pure Python bindings)
- Subtitle parsing: simple regex strip of SRT/VTT timestamps
- Response is standard `JudgeOutput` — frontend doesn't need changes for this version

---

## Acceptance Criteria

- [ ] Upload a `.mp4` → both transcription and frame extraction run
- [ ] Upload a `.mp4` + `.srt` → transcription skipped, frames still extracted
- [ ] `./tmp/{upload_id}/transcript.txt` exists after pipeline
- [ ] `./tmp/{upload_id}/frames/` contains extracted JPGs (sc_, uni_, i_ prefixes)
- [ ] DBOS retries step A independently if ElevenLabs fails (no re-extraction)
- [ ] DBOS retries step B independently if ffmpeg fails (no re-transcription)
- [ ] `POST /judge/video` response is valid `JudgeOutput`
- [ ] `ffmpeg-python>=0.2.0` in pyproject.toml dependencies
- [ ] Same `JudgeOutput` schema as text mode — no new output fields

---

## Notes

- Never use `subprocess` for ffmpeg — use `ffmpeg-python` bindings throughout
- All DBOS steps must be decorated with `@DBOS.step(retries_allowed=True)`
- `./tmp/` is ephemeral — never reference it in tests, never commit it
- If ElevenLabs Scribe isn't available on free tier during dev, mock the transcription step and note it in code

---

**Author:** Claude Code
**Created:** 2026-03-02
