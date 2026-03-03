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

router = APIRouter(prefix="/upload", tags=["upload"])


class UploadResponse(BaseModel):
    upload_id: str
    has_subtitles: bool


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
    bytes_written = 0
    async with aiofiles.open(video_path, "wb") as f:
        while chunk := await video_file.read(_CHUNK_SIZE):
            bytes_written += len(chunk)
            if bytes_written > MAX_UPLOAD_BYTES:
                raise HTTPException(413, f"Upload exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MiB limit")
            await f.write(chunk)

    # Save subtitle if provided
    has_subtitles = False
    if subtitle_file and subtitle_file.filename:
        sub_ext = Path(subtitle_file.filename).suffix.lower()
        if sub_ext not in {".srt", ".vtt", ".txt"}:
            raise HTTPException(400, f"Unsupported subtitle format: {sub_ext}. Use .srt, .vtt, or .txt")
        sub_path = upload_dir / f"subtitles{sub_ext}"
        sub_bytes_written = 0
        async with aiofiles.open(sub_path, "wb") as f:
            while chunk := await subtitle_file.read(_CHUNK_SIZE):
                sub_bytes_written += len(chunk)
                if sub_bytes_written > MAX_SUBTITLE_BYTES:
                    limit_mib = MAX_SUBTITLE_BYTES // (1024 * 1024)
                    raise HTTPException(413, f"Subtitle exceeds {limit_mib} MiB limit")
                await f.write(chunk)
        has_subtitles = True

    return UploadResponse(upload_id=upload_id, has_subtitles=has_subtitles)
