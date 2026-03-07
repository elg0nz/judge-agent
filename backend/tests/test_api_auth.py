from app.db.models import User


def test_signup(client, db_session):
    response = client.post("/auth/signup", json={"username": "testuser"})
    assert response.status_code == 200
    data = response.json()
    assert "uuid" in data
    assert "username" in data
    assert data["username"] == "testuser"

    # verify in db
    user = db_session.query(User).filter_by(username="testuser").first()
    assert user is not None
    assert user.uuid == data["uuid"]

def test_signup_existing_user(client, db_session):
    # First signup
    resp1 = client.post("/auth/signup", json={"username": "existinguser"})
    assert resp1.status_code == 200
    uuid1 = resp1.json()["uuid"]

    # Second signup with same username should return the same uuid (idempotent style for this poc)
    resp2 = client.post("/auth/signup", json={"username": "existinguser"})
    assert resp2.status_code == 200
    uuid2 = resp2.json()["uuid"]

    assert uuid1 == uuid2
