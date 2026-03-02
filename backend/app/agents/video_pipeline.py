"""Video analysis pipeline: transcription + frame extraction + judge."""

import asyncio
import concurrent.futures
import glob as glob_module
import re
from pathlib import Path

from dbos import DBOS

from app.agents.judge_agent import run_judge
from app.agents.output import ContentType, JudgeOutput
from app.core.config import settings

TMP_DIR = Path("./tmp")


@DBOS.step(retries_allowed=True, max_attempts=3, backoff_rate=2.0, interval_seconds=1.0)
def transcribe_or_parse(upload_id: str) -> str:
    """Transcribe video audio or parse provided subtitle file.

    If a subtitle file exists in the upload directory, parse it to plain text.
    Otherwise, use ElevenLabs Scribe for speech-to-text.
    """
    upload_dir = TMP_DIR / upload_id
    transcript_path = upload_dir / "transcript.txt"

    # Check for existing subtitle file
    for ext in (".srt", ".vtt", ".txt"):
        sub_path = list(upload_dir.glob(f"subtitles{ext}"))
        if sub_path:
            text = _parse_subtitles(sub_path[0])
            transcript_path.write_text(text, encoding="utf-8")
            return text

    # No subtitles — use ElevenLabs Scribe
    video_path = _find_video(upload_dir)
    if not video_path:
        raise FileNotFoundError(f"No video file in {upload_dir}")

    if not settings.ELEVENLABS_API_KEY:
        # Mock transcription for dev when no API key available
        mock_text = (
            f"[Mock transcript for {upload_id} — set ELEVENLABS_API_KEY for real transcription]"
        )
        transcript_path.write_text(mock_text, encoding="utf-8")
        return mock_text

    from elevenlabs.client import ElevenLabs  # noqa: PLC0415

    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

    with open(video_path, "rb") as f:
        result = client.speech_to_text.convert(
            file=f,
            model_id="scribe_v1",
        )

    text = result.text if hasattr(result, "text") else str(result)
    transcript_path.write_text(text, encoding="utf-8")
    return text


@DBOS.step(retries_allowed=True, max_attempts=3, backoff_rate=2.0, interval_seconds=1.0)
def extract_frames(upload_id: str) -> list[str]:
    """Extract three sets of frames from the uploaded video using ffmpeg-python."""
    import ffmpeg  # noqa: PLC0415

    upload_dir = TMP_DIR / upload_id
    frames_dir = upload_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    video_path = _find_video(upload_dir)
    if not video_path:
        raise FileNotFoundError(f"No video file in {upload_dir}")

    video_str = str(video_path)
    frames_str = str(frames_dir)

    # Scene changes (content-aware, high value)
    try:
        ffmpeg.input(video_str).output(
            f"{frames_str}/sc_%06d.jpg",
            vf="select='gt(scene,0.35)',showinfo",
            vsync="vfr",
            frame_pts=1,
        ).overwrite_output().run(quiet=True)
    except ffmpeg.Error:
        pass  # Some videos have no scene changes; that's okay

    # Uniform 2fps sample (coverage)
    ffmpeg.input(video_str).output(
        f"{frames_str}/uni_%06d.jpg",
        vf="fps=2",
    ).overwrite_output().run(quiet=True)

    # I-frames only (keyframes, low noise)
    try:
        ffmpeg.input(video_str).output(
            f"{frames_str}/i_%06d.jpg",
            vf="select='eq(pict_type\\,I)'",
            vsync="vfr",
        ).overwrite_output().run(quiet=True)
    except ffmpeg.Error:
        pass  # Some formats don't expose pict_type; that's okay

    # Return list of all extracted frame paths
    frame_files = sorted(glob_module.glob(f"{frames_str}/*.jpg"))
    return frame_files


@DBOS.workflow()
def judge_video_workflow(upload_id: str, user_uuid: str | None = None) -> JudgeOutput:
    """DBOS workflow: transcribe, extract frames, then judge.

    Steps A (transcribe) and B (extract frames) run concurrently.
    Step C (judge) waits for both.
    """
    # Steps A and B run concurrently
    # DBOS steps are synchronous, so we run them in threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_a = executor.submit(transcribe_or_parse, upload_id)
        future_b = executor.submit(extract_frames, upload_id)

        transcript = future_a.result()
        frame_paths = future_b.result()

    # Step C: judge with combined transcript + frames context
    # Build content that includes transcript and frame info
    frame_summary = f"\n\n[Extracted {len(frame_paths)} frames from video]"
    content = transcript + frame_summary

    result = asyncio.run(run_judge(content, ContentType.VIDEO))
    return result


def _find_video(upload_dir: Path) -> Path | None:
    """Find the video file in an upload directory."""
    for ext in (".mp4", ".mov", ".webm"):
        matches = list(upload_dir.glob(f"video{ext}"))
        if matches:
            return matches[0]
    return None


def _parse_subtitles(path: Path) -> str:
    """Parse SRT or VTT subtitle file to plain text."""
    content = path.read_text(encoding="utf-8")
    suffix = path.suffix.lower()

    if suffix == ".txt":
        return content

    # Strip SRT/VTT formatting: timestamps, cue IDs, WEBVTT header
    lines = content.split("\n")
    text_lines = []
    for line in lines:
        line = line.strip()
        # Skip empty lines
        if not line:
            continue
        # Skip WEBVTT header
        if line.startswith("WEBVTT"):
            continue
        # Skip cue IDs (just numbers)
        if re.match(r"^\d+$", line):
            continue
        # Skip timestamp lines (00:00:00.000 --> 00:00:00.000)
        if re.match(r"\d{2}:\d{2}[:\.]", line):
            continue
        # Skip NOTE lines
        if line.startswith("NOTE"):
            continue
        text_lines.append(line)

    return " ".join(text_lines)


__all__ = ["judge_video_workflow", "transcribe_or_parse", "extract_frames"]
