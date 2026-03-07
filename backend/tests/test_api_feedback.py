from app.db.models import Feedback


def test_submit_feedback_success(client, db_session):
    response = client.post("/feedback", json={
        "judge_request_id": "test_req_1",
        "rating": "up",
        "content_type": "text"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # check db
    fb = db_session.query(Feedback).filter_by(judge_request_id="test_req_1").first()
    assert fb is not None
    assert fb.rating == "up"

def test_submit_feedback_invalid_rating(client):
    response = client.post("/feedback", json={
        "judge_request_id": "test_req_2",
        "rating": "invalid",
        "content_type": "text"
    })
    assert response.status_code == 400

def test_submit_feedback_invalid_content_type(client):
    response = client.post("/feedback", json={
        "judge_request_id": "test_req_3",
        "rating": "up",
        "content_type": "invalid"
    })
    assert response.status_code == 400

def test_submit_feedback_duplicate(client, db_session):
    client.post("/feedback", json={
        "judge_request_id": "test_req_4",
        "rating": "down",
        "content_type": "video"
    })

    # submit again
    response = client.post("/feedback", json={
        "judge_request_id": "test_req_4",
        "rating": "down",
        "content_type": "video"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Feedback already recorded"
