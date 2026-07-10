"""Recommendation reads + the full human-in-the-loop approval lifecycle."""
from __future__ import annotations


def test_recommendations_seeded_awaiting_verification(client):
    j = client.get("/api/recommendations").json()
    assert isinstance(j, list) and j
    assert all(r["status"] == "awaiting_verification" for r in j)


def test_recommendations_filters(client):
    assert client.get("/api/recommendations?status=open").status_code == 200
    rts = client.get("/api/recommendations?transfer_type=return_to_store").json()
    assert isinstance(rts, list)
    assert all(r["transfer_type"] == "return_to_store" for r in rts)


def test_generate(client):
    gen = client.post("/api/recommendations/generate", json={}).json()
    assert len(gen) > 0
    assert any(r["transfer_type"] == "redistribution" for r in gen)


def test_full_approval_lifecycle(client):
    gen = client.post("/api/recommendations/generate", json={}).json()
    rid = next(r["recommendation_id"] for r in gen if r["transfer_type"] == "redistribution")

    verified = client.post(f"/api/recommendations/{rid}/verify",
                           json={"verified_by": "pharm"}).json()
    assert verified["status"] == "awaiting_approval"
    assert verified["verified_at"]

    approved = client.post(f"/api/recommendations/{rid}/approve",
                           json={"approved_by": "mgr", "actual_qty": 40}).json()
    assert approved["status"] == "approved"
    assert approved["actual_qty"] == 40

    assigned = client.post(f"/api/recommendations/{rid}/assign", json={}).json()
    assert assigned["status"] == "assigned"

    picked = client.post(f"/api/recommendations/{rid}/pickup", json={}).json()
    assert picked["status"] == "picked_up"

    confirmed = client.post(f"/api/recommendations/{rid}/confirm",
                            json={"received_qty": 40, "received_condition": "good"}).json()
    assert confirmed["status"] == "stock_updated"

    timeline = client.get(f"/api/recommendations/{rid}/timeline").json()
    assert len(timeline) >= 5


def test_reject_with_reason(client):
    gen = client.post("/api/recommendations/generate", json={}).json()
    rid = next(r["recommendation_id"] for r in gen
               if r["transfer_type"] == "redistribution" and not r["emergency"])
    rejected = client.post(f"/api/recommendations/{rid}/reject",
                           json={"reason": "transport unavailable"}).json()
    assert rejected["status"] == "rejected"
