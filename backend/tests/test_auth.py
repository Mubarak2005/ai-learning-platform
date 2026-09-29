def test_register_and_login(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": "pytest.user@stats.gov.in",
            "password": "SecurePass123",
            "role": "statistical_officer",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "pytest.user@stats.gov.in"
    assert body["is_email_verified"] is False

    login_resp = client.post(
        "/api/v1/auth/login-json",
        json={"email": "pytest.user@stats.gov.in", "password": "SecurePass123"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_duplicate_registration_rejected(client):
    payload = {
        "full_name": "Dup User",
        "email": "dup.user@stats.gov.in",
        "password": "SecurePass123",
        "role": "statistical_officer",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Wrong Pass",
            "email": "wrongpass@stats.gov.in",
            "password": "SecurePass123",
            "role": "statistical_officer",
        },
    )
    resp = client.post(
        "/api/v1/auth/login-json",
        json={"email": "wrongpass@stats.gov.in", "password": "IncorrectPassword"},
    )
    assert resp.status_code == 401


def test_protected_route_requires_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Me User",
            "email": "me.user@stats.gov.in",
            "password": "SecurePass123",
            "role": "trainer",
        },
    )
    token = client.post(
        "/api/v1/auth/login-json",
        json={"email": "me.user@stats.gov.in", "password": "SecurePass123"},
    ).json()["access_token"]

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "trainer"
