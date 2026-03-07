"""File upload endpoint for video analysis pipeline."""

import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings

_CHUNK_SIZE = 1024 * 1024  # 1 MiB
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MiB
MAX_SUBTITLE_BYTES = 10 * 1024 * 1024  # 10 MiB

_ALLOWED_VIDEO_MIME_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
_ALLOWED_SUBTITLE_EXTENSIONS = {".srt", ".vtt", ".txt"}

router = APIRouter(prefix="/upload", tags=["upload"])


class UploadResponse(BaseModel):
    upload_id: str
    has_subtitles: bool


async def _write_upload_with_limit(
    *,
    source: UploadFile,
    destination: Path,
    max_bytes: int,
    oversize_message: str,
) -> None:
    bytes_written = 0
    async with aiofiles.open(destination, "wb") as f:
        while chunk := await source.read(_CHUNK_SIZE):
            bytes_written += len(chunk)
            if bytes_written > max_bytes:
                raise HTTPException(413, oversize_message)
            await f.write(chunk)


@router.post("", response_model=UploadResponse)
async def upload_files(
    video_file: UploadFile = File(...),
    subtitle_file: UploadFile | None = File(None),
) -> UploadResponse:
    """Upload video and optional subtitle file for analysis."""
    # Validate MIME type (primary guard — client-supplied but more reliable than filename)
    if video_file.content_type and video_file.content_type not in _ALLOWED_VIDEO_MIME_TYPES:
        raise HTTPException(
            400,
            f"Unsupported video MIME type: {video_file.content_type}. "
            "Expected video/mp4, video/quicktime, or video/webm",
        )

    # Validate video extension (secondary guard)
    if video_file.filename:
        ext = Path(video_file.filename).suffix.lower()
        if ext not in {".mp4", ".mov", ".webm"}:
            raise HTTPException(400, f"Unsupported video format: {ext}. Use .mp4, .mov, or .webm")
    else:
        ext = ".mp4"

    upload_id = str(uuid.uuid4())
    upload_dir = settings.TMP_DIR / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save video with size limit
    video_path = upload_dir / f"video{ext}"
    upload_limit_mib = MAX_UPLOAD_BYTES // (1024 * 1024)
    await _write_upload_with_limit(
        source=video_file,
        destination=video_path,
        max_bytes=MAX_UPLOAD_BYTES,
        oversize_message=f"Upload exceeds {upload_limit_mib} MiB limit",
    )

    # Save subtitle if provided
    has_subtitles = False
    if subtitle_file and subtitle_file.filename:
        sub_ext = Path(subtitle_file.filename).suffix.lower()
        if sub_ext not in _ALLOWED_SUBTITLE_EXTENSIONS:
            raise HTTPException(
                400,
                f"Unsupported subtitle format: {sub_ext}. Use .srt, .vtt, or .txt",
            )
        sub_path = upload_dir / f"subtitles{sub_ext}"
        subtitle_limit_mib = MAX_SUBTITLE_BYTES // (1024 * 1024)
        await _write_upload_with_limit(
            source=subtitle_file,
            destination=sub_path,
            max_bytes=MAX_SUBTITLE_BYTES,
            oversize_message=f"Subtitle exceeds {subtitle_limit_mib} MiB limit",
        )
        has_subtitles = True

    return UploadResponse(upload_id=upload_id, has_subtitles=has_subtitles)
