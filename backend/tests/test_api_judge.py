import pytest

import app.api.judge
from app.agents.output import DistributionSegment, JudgeOutput, OriginOutput, ViralityOutput
from app.db.models import JudgeRun, User


# Helper to create a dummy JudgeOutput
def create_dummy_output():
    return JudgeOutput(
        origin=OriginOutput(prediction="AI-generated", confidence=0.9, signals=["signal1"]),
        virality=ViralityOutput(score=50, drivers=["driver1"]),
        distribution=[
            DistributionSegment(segment="seg1", platforms=["plat1"], reaction="share"),
            DistributionSegment(segment="seg2", platforms=["plat2"], reaction="ignore")
        ],
        explanation="Test explanation"
    )

@pytest.fixture
def mock_run_judge(monkeypatch):
    async def mock_run(content: str, *args, **kwargs):
        return create_dummy_output()
    monkeypatch.setattr(app.api.judge, "run_judge", mock_run)

@pytest.fixture
def mock_judge_video(monkeypatch):
    async def mock_run(upload_id: str, *args, **kwargs):
        return create_dummy_output()
    monkeypatch.setattr(app.api.judge, "judge_video_workflow", mock_run)

def test_judge_text_no_user(client, mock_run_judge):
    response = client.post("/judge", json={"content": "test text"})
    assert response.status_code == 200
    data = response.json()
    assert data["origin"]["prediction"] == "AI-generated"

def test_judge_text_with_user(client, db_session, mock_run_judge):
    # create a user first
    user = User(username="testuser_judge")
    db_session.add(user)
    db_session.commit()

    response = client.post("/judge", json={"content": "test text", "user_uuid": user.uuid})
    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] is not None

    # query db to see if it's stored
    run = db_session.query(JudgeRun).filter_by(id=data["run_id"]).first()
    assert run is not None
    assert run.user_uuid == user.uuid

def test_judge_text_cached(client, db_session, mock_run_judge):
    user = User(username="testuser_cache")
    db_session.add(user)
    db_session.commit()

    # First request
    resp1 = client.post("/judge", json={"content": "test text cache", "user_uuid": user.uuid})
    assert resp1.status_code == 200
    run_id1 = resp1.json()["run_id"]

    # Second request with same content should return cached result
    resp2 = client.post("/judge", json={"content": "test text cache", "user_uuid": user.uuid})
    assert resp2.status_code == 200
    assert resp2.json()["run_id"] == run_id1

def test_judge_text_invalid_user(client):
    response = client.post("/judge", json={"content": "test text", "user_uuid": "invalid-uuid"})
    assert response.status_code == 404

def test_get_history(client, db_session, mock_run_judge):
    user = User(username="testuser_history")
    db_session.add(user)
    db_session.commit()

    # generate a run
    client.post("/judge", json={"content": "test history text", "user_uuid": user.uuid})

    response = client.get(f"/judge/history?user_uuid={user.uuid}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["input_preview"] == "test history text"
    assert "output" in data[0]

def test_judge_video(client, mock_judge_video):
    response = client.post("/judge/video", json={"upload_id": "test_upload_id"})
    assert response.status_code == 200
    data = response.json()
    assert data["origin"]["prediction"] == "AI-generated"
