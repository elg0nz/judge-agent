"""File upload endpoint for video analysis pipeline."""

import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/upload", tags=["upload"])

TMP_DIR = Path("./tmp")


class UploadResponse(BaseModel):
    upload_id: str
    has_subtitles: bool


@router.post("", response_model=UploadResponse)
async def upload_files(
    video_file: UploadFile = File(...),
    subtitle_file: UploadFile | None = File(None),
) -> UploadResponse:
    """Upload video and optional subtitle file for analysis."""
    # Validate video extension
    if video_file.filename:
        ext = Path(video_file.filename).suffix.lower()
        if ext not in {".mp4", ".mov", ".webm"}:
            raise HTTPException(400, f"Unsupported video format: {ext}. Use .mp4, .mov, or .webm")
    else:
        ext = ".mp4"

    upload_id = str(uuid.uuid4())
    upload_dir = TMP_DIR / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save video
    video_path = upload_dir / f"video{ext}"
    content = await video_file.read()
    video_path.write_bytes(content)

    # Save subtitle if provided
    has_subtitles = False
    if subtitle_file and subtitle_file.filename:
        sub_ext = Path(subtitle_file.filename).suffix.lower()
        if sub_ext not in {".srt", ".vtt", ".txt"}:
            raise HTTPException(400, f"Unsupported subtitle format: {sub_ext}. Use .srt, .vtt, or .txt")
        sub_path = upload_dir / f"subtitles{sub_ext}"
        sub_content = await subtitle_file.read()
        sub_path.write_bytes(sub_content)
        has_subtitles = True

    return UploadResponse(upload_id=upload_id, has_subtitles=has_subtitles)
