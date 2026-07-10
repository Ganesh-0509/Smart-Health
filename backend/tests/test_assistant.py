"""AI assistant + supervisor briefing (keyless => deterministic fallback)."""
from __future__ import annotations


def test_assistant_status(client):
    j = client.get("/api/assistant/status").json()
    assert j["gemini_enabled"] is False
    assert j["mode"] == "fallback"
    assert isinstance(j["model"], str)


def test_assistant_ask(client):
    j = client.post("/api/assistant/ask",
                    json={"question": "which centres are most at risk?", "lang": "en"}).json()
    assert isinstance(j["answer_en"], str) and j["answer_en"]
    assert isinstance(j["answer_hi"], str) and j["answer_hi"]
    assert j["source"] == "fallback"
    assert isinstance(j["grounding"]["critical_items"], int)
    assert isinstance(j["grounding"]["open_transfers"], int)


def test_briefing(client):
    recs = client.get("/api/recommendations").json()
    brid = recs[0]["recommendation_id"]
    j = client.get(f"/api/recommendations/{brid}/briefing").json()
    assert j["briefing_en"]
    assert j["briefing_hi"]
    assert j["source"] == "fallback"
