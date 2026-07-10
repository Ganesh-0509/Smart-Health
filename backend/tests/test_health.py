"""Meta / health endpoints."""
from __future__ import annotations


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "ok"
    assert isinstance(j["version"], str)


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    j = r.json()
    assert j["health"] == "/api/health"
