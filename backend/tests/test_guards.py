"""State-machine guard rails: 409 (illegal transition) and 400 (missing reason).

Recommendations are generated once in the session fixture (see conftest), so
these tests read an existing ``awaiting_verification`` rec rather than paying the
~30s cost of regenerating on every test.
"""
from __future__ import annotations


def _awaiting_rid(client) -> str:
    """A redistribution rec still awaiting verification (non-emergency)."""
    recs = client.get("/api/recommendations", params={"status": "awaiting_verification"}).json()
    return next(r["recommendation_id"] for r in recs
                if r["transfer_type"] == "redistribution" and not r["emergency"])


def test_approve_before_verify_blocked_409(client):
    rid = _awaiting_rid(client)
    # A rec still awaiting verification cannot be approved directly.
    r = client.post(f"/api/recommendations/{rid}/approve", json={})
    assert r.status_code == 409


def test_reject_without_reason_400(client):
    rid = _awaiting_rid(client)
    r = client.post(f"/api/recommendations/{rid}/reject", json={"reason": ""})
    assert r.status_code == 400


def test_unknown_recommendation_404(client):
    r = client.post("/api/recommendations/REC-DOES-NOT-EXIST/verify", json={})
    assert r.status_code == 404
