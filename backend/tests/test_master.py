"""Master data: PHCs and medicines."""
from __future__ import annotations


def test_phcs(client):
    j = client.get("/api/phcs").json()
    assert len(j) >= 8
    assert "digital_maturity" in j[0]


def test_medicines(client):
    j = client.get("/api/medicines").json()
    assert len(j) >= 8
    assert any(m["cold_chain"] for m in j)
