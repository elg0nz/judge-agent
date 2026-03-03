"""Video analysis pipeline: transcription + frame extraction + judge."""

import logging
import re
from pathlib import Path

import ffmpeg
from dbos import DBOS

from app.agents.judge_agent import run_judge
from app.agents.output import ContentType, JudgeOutput
from app.core.config import settings

try:
    from elevenlabs.client import ElevenLabs
except ImportError:
    ElevenLabs = None  # Optional: only needed when ELEVENLABS_API_KEY is set

logger = logging.getLogger(__name__)


@DBOS.step(retries_allowed=True, max_attempts=3, backoff_rate=2.0, interval_seconds=1.0)
def transcribe_or_parse(upload_id: str) -> str:
    """Transcribe video audio or parse provided subtitle file.

    If a subtitle file exists in the upload directory, parse it to plain text.
    Otherwise, use ElevenLabs Scribe for speech-to-text.
    """
    upload_dir = settings.TMP_DIR / upload_id
    transcript_path = upload_dir / "transcript.txt"

    # Check for existing subtitle file
    for ext in (".srt", ".vtt", ".txt"):
        sub_path = next(upload_dir.glob(f"subtitles{ext}"), None)
        if sub_path:
            text = _parse_subtitles(sub_path)
            transcript_path.write_text(text, encoding="utf-8")
            return text

    # No subtitles — use ElevenLabs Scribe
    video_path = _find_video(upload_dir)
    if not video_path:
        raise FileNotFoundError(f"No video file in {upload_dir}")

    if not settings.ELEVENLABS_API_KEY:
        mock_text = f"[Mock transcript for {upload_id} — set ELEVENLABS_API_KEY for real transcription]"
        transcript_path.write_text(mock_text, encoding="utf-8")
        return mock_text

    if ElevenLabs is None:
        raise ImportError("elevenlabs package required — install with: pip install elevenlabs")

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
    upload_dir = settings.TMP_DIR / upload_id
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
    except ffmpeg.Error as e:
        logger.warning("scene extraction skipped: %s", e)

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
    except ffmpeg.Error as e:
        logger.warning("i-frame extraction skipped: %s", e)

    # Return list of all extracted frame paths
    frame_files = sorted(str(p) for p in frames_dir.glob("*.jpg"))
    return frame_files


@DBOS.workflow()
async def judge_video_workflow(upload_id: str, user_uuid: str | None = None) -> JudgeOutput:
    """DBOS workflow: transcribe, extract frames, then judge.

    Steps run sequentially so DBOS can checkpoint each step for durable execution.
    """
    transcript = transcribe_or_parse(upload_id)
    frame_paths = extract_frames(upload_id)

    # Step C: judge with combined transcript + frames context
    frame_summary = f"\n\n[Extracted {len(frame_paths)} frames from video]"
    content = transcript + frame_summary

    result = await run_judge(content, ContentType.VIDEO)
    return result


def _find_video(upload_dir: Path) -> Path | None:
    """Find the video file in an upload directory."""
    for ext in (".mp4", ".mov", ".webm"):
        match = next(upload_dir.glob(f"video{ext}"), None)
        if match:
            return match
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
        stripped = line.strip()
        # Skip empty lines
        if not stripped:
            continue
        # Skip WEBVTT header
        if stripped.startswith("WEBVTT"):
            continue
        # Skip cue IDs (just numbers)
        if re.match(r"^\d+$", stripped):
            continue
        # Skip timestamp lines (00:00:00.000 --> 00:00:00.000)
        if re.match(r"\d{2}:\d{2}[:\.]", stripped):
            continue
        # Skip NOTE lines
        if stripped.startswith("NOTE"):
            continue
        text_lines.append(stripped)

    return " ".join(text_lines)


__all__ = ["judge_video_workflow", "transcribe_or_parse", "extract_frames"]
