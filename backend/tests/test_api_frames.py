import pytest


@pytest.fixture
def test_frames_dir(tmp_path):
    upload_id = "test_upload_id"
    frames_dir = tmp_path / upload_id / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    # create dummy frame files
    (frames_dir / "sc_1.jpg").write_text("dummy")
    (frames_dir / "uni_1.jpg").write_text("dummy")
    (frames_dir / "i_1.jpg").write_text("dummy")
    (frames_dir / "other_1.jpg").write_text("dummy")

    return tmp_path, upload_id

def test_list_frames(client, test_frames_dir, monkeypatch):
    tmp_path, upload_id = test_frames_dir
    # patch TMP_DIR in app.api.frames
    import app.api.frames
    monkeypatch.setattr(app.api.frames, "TMP_DIR", tmp_path)

    response = client.get(f"/frames/{upload_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    types = {frame["type"] for frame in data}
    assert "scene" in types
    assert "uniform" in types
    assert "keyframe" in types
    assert "unknown" in types

def test_list_frames_not_found(client, monkeypatch, tmp_path):
    import app.api.frames
    monkeypatch.setattr(app.api.frames, "TMP_DIR", tmp_path)

    response = client.get("/frames/non_existent")
    assert response.status_code == 404

def test_serve_frame(client, test_frames_dir, monkeypatch):
    tmp_path, upload_id = test_frames_dir
    import app.api.frames
    monkeypatch.setattr(app.api.frames, "TMP_DIR", tmp_path)

    response = client.get(f"/frames/{upload_id}/file/sc_1.jpg")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"

def test_serve_frame_not_found(client, test_frames_dir, monkeypatch):
    tmp_path, upload_id = test_frames_dir
    import app.api.frames
    monkeypatch.setattr(app.api.frames, "TMP_DIR", tmp_path)

    response = client.get(f"/frames/{upload_id}/file/sc_999.jpg")
    assert response.status_code == 404

def test_serve_frame_invalid_filename(client):
    response = client.get("/frames/123/file/..%2Fetc%2Fpasswd")
    # %2F gets decoded by FastAPI and reaches the endpoint logic if it doesn't 404 early
    assert response.status_code in (400, 404)
