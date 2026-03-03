"""Frame serving endpoints for video analysis results."""

import glob as glob_module
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/frames", tags=["frames"])

TMP_DIR = Path("./tmp")


class FrameInfo(BaseModel):
    filename: str
    type: str
    url: str


@router.get("/{upload_id}")
async def list_frames(upload_id: str) -> list[FrameInfo]:
    """List extracted frames for an upload with type labels."""
    frames_dir = TMP_DIR / upload_id / "frames"
    if not frames_dir.exists():
        raise HTTPException(404, f"No frames found for upload {upload_id}")

    frame_files = sorted(glob_module.glob(str(frames_dir / "*.jpg")))

    frames = []
    for f in frame_files:
        name = Path(f).name
        if name.startswith("sc_"):
            frame_type = "scene"
        elif name.startswith("uni_"):
            frame_type = "uniform"
        elif name.startswith("i_"):
            frame_type = "keyframe"
        else:
            frame_type = "unknown"

        frames.append(FrameInfo(
            filename=name,
            type=frame_type,
            url=f"/frames/{upload_id}/file/{name}",
        ))

    return frames


@router.get("/{upload_id}/file/{filename}")
async def serve_frame(upload_id: str, filename: str) -> FileResponse:
    """Serve a single frame image file."""
    # Prevent directory traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(400, "Invalid filename")
    frame_path = TMP_DIR / upload_id / "frames" / filename
    if not frame_path.exists():
        raise HTTPException(404, "Frame not found")
    return FileResponse(frame_path, media_type="image/jpeg")


__all__ = ["router"]
