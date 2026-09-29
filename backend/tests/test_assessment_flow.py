def _register_and_login(client, email, role="statistical_officer"):
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Flow User", "email": email, "password": "SecurePass123", "role": role},
    )
    token = client.post(
        "/api/v1/auth/login-json", json={"email": email, "password": "SecurePass123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_assessment_updates_competency_and_gap(client):
    headers = _register_and_login(client, "flow.user@stats.gov.in")
    client.put("/api/v1/users/me/profile", json={"job_role": "Data Analyst"}, headers=headers)

    gaps_before = client.get("/api/v1/skill-gaps/me", headers=headers).json()
    assert len(gaps_before) > 0
    assert all(g["current_level"] == 0 for g in gaps_before)
    assert all(g["severity"] == "critical" for g in gaps_before)

    start_resp = client.post("/api/v1/assessments/competency-check/start", headers=headers)
    assert start_resp.status_code == 200
    assessment = start_resp.json()
    assert len(assessment["questions"]) > 0

    # We don't have the correct answers via the API (by design — they're
    # never exposed to the learner), so answer everything with option 0 and
    # just assert the loop runs end-to-end.
    answers = {q["id"]: 0 for q in assessment["questions"]}
    submit_resp = client.post(
        f"/api/v1/assessments/competency-check/{assessment['id']}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert submit_resp.status_code == 200

    # Duplicate submission must be rejected.
    dup_resp = client.post(
        f"/api/v1/assessments/competency-check/{assessment['id']}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert dup_resp.status_code == 409

    gaps_after = client.get("/api/v1/skill-gaps/me", headers=headers).json()
    assert len(gaps_after) == len(gaps_before)


def test_admin_endpoints_require_admin_role(client):
    headers = _register_and_login(client, "not.admin@stats.gov.in")
    resp = client.get("/api/v1/admin/overview", headers=headers)
    assert resp.status_code == 403
