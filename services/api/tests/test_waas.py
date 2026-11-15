import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"X-Waas-Token": "waas_demo_token_2026"}

def test_waas_guarantors_directory():
    response = client.get("/v1/waas/guarantors")
    assert response.status_code == 200
    data = response.json()
    assert "institutions" in data
    assert "individuals" in data
    assert "guarantors" in data
    assert len(data["guarantors"]) >= 2
    # Verify data minimization (no phone numbers leaked in public directory)
    for g in data["guarantors"]:
        assert "phone" not in g
        assert "contactPhone" not in g

def test_waas_request_and_matching_flow():
    # 1. Create request
    req_res = client.post(
        "/v1/waas/request",
        json={
            "applicantName": "Selamawit Haile",
            "phone": "+251911445566",
            "purpose": "scholarship",
            "courseRef": "alx-track2-accessibility",
            "consentApplicant": True
        }
    )
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert req_data["success"] is True
    request_id = req_data["requestId"]
    assert request_id.startswith("req_")

    # 2. Matchmaking (Explainable, no trust score 0-100)
    match_res = client.get(f"/v1/waas/match/{request_id}")
    assert match_res.status_code == 200
    match_data = match_res.json()
    assert match_data["status"] == "eligible"
    assert len(match_data["matches"]) > 0
    first_match = match_data["matches"][0]
    assert "matchReason" in first_match
    assert "trustScore" not in first_match

    # 3. Approve request
    approve_res = client.post(
        f"/v1/waas/{request_id}/approve",
        json={"guarantorId": first_match["id"], "guarantorConsent": True}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # 4. Issue credential (Open Badges 3.0)
    issue_res = client.post(f"/v1/waas/{request_id}/issue")
    assert issue_res.status_code == 200
    issue_data = issue_res.json()
    waas_id = issue_data["waasId"]
    assert waas_id.startswith("WAAS-")
    assert "credential" in issue_data
    assert "signature" in issue_data

    # 5. Public verification (Valid)
    verify_res = client.get(f"/v1/waas/verify/{waas_id}")
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["isValid"] is True
    assert verify_data["status"] == "VALID"
    assert verify_data["subject"]["name"] == "Selamawit Haile"
    assert verify_data["signatureValid"] is True

    # 6. Revoke credential
    revoke_res = client.post(
        f"/v1/waas/revoke/{waas_id}",
        json={"reason": "Course completed and guarantee term fulfilled"},
        headers=AUTH_HEADERS
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "REVOKED"

    # 7. Public verification (Revoked)
    reverify_res = client.get(f"/v1/waas/verify/{waas_id}")
    assert reverify_res.status_code == 200
    reverify_data = reverify_res.json()
    assert reverify_data["isValid"] is False
    assert reverify_data["status"] == "REVOKED"
