import io

import app.api.upload


def test_upload_video_only(client, monkeypatch, tmp_path):
    monkeypatch.setattr(app.api.upload.settings, "TMP_DIR", tmp_path)

    file_content = b"fake video data"
    files = {"video_file": ("test.mp4", io.BytesIO(file_content), "video/mp4")}

    response = client.post("/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "upload_id" in data
    assert data["has_subtitles"] is False

    upload_id = data["upload_id"]
    saved_file = tmp_path / upload_id / "video.mp4"
    assert saved_file.exists()
    assert saved_file.read_bytes() == file_content

def test_upload_video_and_subtitle(client, monkeypatch, tmp_path):
    monkeypatch.setattr(app.api.upload.settings, "TMP_DIR", tmp_path)

    video_content = b"fake video data"
    sub_content = b"fake subtitle data"

    files = {
        "video_file": ("test.mp4", io.BytesIO(video_content), "video/mp4"),
        "subtitle_file": ("subs.srt", io.BytesIO(sub_content), "text/plain")
    }

    response = client.post("/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["has_subtitles"] is True

    upload_id = data["upload_id"]
    assert (tmp_path / upload_id / "video.mp4").exists()
    assert (tmp_path / upload_id / "subtitles.srt").exists()

def test_upload_invalid_video_mime(client):
    files = {"video_file": ("test.mp4", io.BytesIO(b"fake"), "text/plain")}
    response = client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported video MIME type" in response.json()["detail"]

def test_upload_invalid_video_ext(client):
    files = {"video_file": ("test.txt", io.BytesIO(b"fake"), "video/mp4")}
    response = client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported video format" in response.json()["detail"]

def test_upload_invalid_subtitle_ext(client, monkeypatch, tmp_path):
    monkeypatch.setattr(app.api.upload.settings, "TMP_DIR", tmp_path)
    files = {
        "video_file": ("test.mp4", io.BytesIO(b"video"), "video/mp4"),
        "subtitle_file": ("subs.xyz", io.BytesIO(b"sub"), "text/plain")
    }
    response = client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported subtitle format" in response.json()["detail"]
