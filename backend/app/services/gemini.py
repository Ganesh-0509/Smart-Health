"""Gemini integration — the project's Google AI layer.

Design principle (matches the rest of the app): **graceful degradation.**
Every function works with *no* API key by falling back to the existing
deterministic template/regex logic, so the demo can never break. When
``GEMINI_API_KEY`` is set, the same functions light up with live Gemini output.

Enabled by:  export GEMINI_API_KEY=...   (free key from https://aistudio.google.com/apikey)
Model:       GEMINI_MODEL (default: gemini-2.0-flash — free tier)

Used for three genuinely-useful, on-theme tasks:
  1. parse_sms_nl   — parse free-form / messy stock SMS a regex can't (rural accessibility)
  2. briefing       — plain-language bilingual justification of a transfer for the approver
  3. answer_question — natural-language Q&A over live district data ("Ask the district")
"""
from __future__ import annotations

import json
import re
from functools import lru_cache

from app.core.config import settings

_SDK_ERROR: str | None = None


def enabled() -> bool:
    """True only when a key is configured AND the SDK imports cleanly."""
    return bool(settings.gemini_api_key) and _client() is not None


@lru_cache(maxsize=1)
def _client():
    """Lazily construct the google-genai client. Returns None if unavailable."""
    global _SDK_ERROR
    if not settings.gemini_api_key:
        return None
    try:
        from google import genai  # google-genai (unified SDK)

        return genai.Client(api_key=settings.gemini_api_key)
    except Exception as exc:  # noqa: BLE001 — never let AI setup crash the app
        _SDK_ERROR = str(exc)
        return None


def status() -> dict:
    """Report AI availability for the UI status badge."""
    return {
        "gemini_enabled": enabled(),
        "model": settings.gemini_model,
        "mode": "live" if enabled() else "fallback",
        "note_en": ("Live Gemini responses." if enabled()
                    else "Running in deterministic fallback mode — set GEMINI_API_KEY to enable live AI."),
        "note_hi": ("Gemini लाइव उत्तर।" if enabled()
                    else "नियतात्मक फ़ॉलबैक मोड — लाइव AI के लिए GEMINI_API_KEY सेट करें।"),
    }


def _generate(prompt: str, *, system: str | None = None, as_json: bool = False) -> str | None:
    """Single Gemini call. Returns text, or None on any error (caller falls back)."""
    client = _client()
    if client is None:
        return None
    try:
        from google.genai import types

        cfg = types.GenerateContentConfig(
            temperature=0.2,
            system_instruction=system,
            response_mime_type="application/json" if as_json else "text/plain",
        )
        resp = client.models.generate_content(
            model=settings.gemini_model, contents=prompt, config=cfg,
        )
        return (resp.text or "").strip() or None
    except Exception:  # noqa: BLE001 — any failure => graceful fallback
        return None


def _extract_json(text: str) -> dict | None:
    """Best-effort JSON parse (handles ```json fences and stray prose)."""
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                return None
    return None


# --- 1. Natural-language SMS parsing -------------------------------------------------
def parse_sms_nl(message: str, phc_ids: list[str], medicine_names: list[str]) -> dict | None:
    """Extract structured stock fields from a free-form SMS using Gemini.

    Returns {phc_hint, medicine_hint, qty, expiry, batch} or None if AI is
    unavailable / unsure. The caller resolves hints against the DB and validates.
    """
    if not enabled():
        return None
    system = (
        "You extract structured medicine-stock data from informal SMS messages sent by "
        "rural health-centre staff in India. Messages may be in English, Hindi, or "
        "Hinglish and may be grammatically loose. Return STRICT JSON only."
    )
    prompt = (
        f"Known PHC/CHC IDs: {', '.join(phc_ids)}\n"
        f"Known medicines: {', '.join(medicine_names)}\n\n"
        f'SMS: "{message}"\n\n'
        "Return JSON with keys: phc_hint (best-matching PHC id or free text), "
        "medicine_hint (best-matching medicine name or free text), qty (integer), "
        "expiry (YYYY-MM or YYYY-MM-DD or null), batch (string or null). "
        "If you cannot find a quantity, set qty to null."
    )
    data = _extract_json(_generate(prompt, system=system, as_json=True) or "")
    if not data or data.get("qty") in (None, ""):
        return None
    try:
        data["qty"] = int(data["qty"])
    except (TypeError, ValueError):
        return None
    return data


# --- 2. Supervisor briefing ----------------------------------------------------------
def briefing(rec: dict) -> dict | None:
    """Plain-language bilingual justification of a transfer for the approver.

    Returns {briefing_en, briefing_hi, source: "gemini"} or None (caller falls back
    to the deterministic template built from the recommendation's own reason fields).
    """
    if not enabled():
        return None
    facts = {
        "medicine": rec.get("medicine_name"),
        "quantity": rec.get("suggested_qty"),
        "from": rec.get("source_phc_name"),
        "to": rec.get("target_phc_name") or "district store",
        "urgency": rec.get("urgency"),
        "predicted_stockout_date": rec.get("predicted_stockout_date"),
        "source_buffer_days_after_transfer": rec.get("source_buffer_days_after"),
        "distance_km": rec.get("distance_km"),
        "batch": rec.get("batch_no"),
        "expiry": rec.get("expiry_date"),
        "cold_chain": rec.get("cold_chain"),
        "logistics_model": rec.get("logistics_model"),
        "data_confidence": rec.get("confidence"),
    }
    system = (
        "You brief a District/Block Health Officer who must APPROVE, MODIFY, or REJECT a "
        "medicine stock transfer between rural health centres. Be concise, factual, and "
        "decision-oriented. Never invent numbers beyond the facts given. 2-3 sentences each."
    )
    prompt = (
        "Facts (JSON):\n" + json.dumps(facts, ensure_ascii=False) + "\n\n"
        "Write a short approval briefing. Return STRICT JSON with keys "
        "briefing_en (English) and briefing_hi (Hindi). Mention the risk being mitigated, "
        "that the source keeps a safe buffer, and any caution (cold chain, low data "
        "confidence, near expiry) the officer should verify before approving."
    )
    data = _extract_json(_generate(prompt, system=system, as_json=True) or "")
    if not data or not data.get("briefing_en"):
        return None
    return {"briefing_en": data.get("briefing_en"),
            "briefing_hi": data.get("briefing_hi", ""),
            "source": "gemini"}


# --- 3. Ask-the-district Q&A ---------------------------------------------------------
def answer_question(question: str, context: dict, lang: str = "en") -> dict | None:
    """Answer a natural-language question over a compact live-data snapshot.

    ``context`` is a small JSON-serialisable dict (district overview + top risks +
    open recommendations). Returns {answer_en, answer_hi, source: "gemini"} or None.
    """
    if not enabled():
        return None
    system = (
        "You are the analytics assistant for a rural district health supply-chain platform. "
        "Answer ONLY from the provided data snapshot. If the answer is not in the data, say so "
        "plainly. Be specific — cite centre names, medicine names, and numbers. Keep it under "
        "120 words. This is decision support; do not give medical/clinical advice."
    )
    prompt = (
        "Live data snapshot (JSON):\n" + json.dumps(context, ensure_ascii=False)[:12000] + "\n\n"
        f'Question: "{question}"\n\n'
        "Return STRICT JSON with keys answer_en (English) and answer_hi (Hindi)."
    )
    data = _extract_json(_generate(prompt, system=system, as_json=True) or "")
    if not data or not data.get("answer_en"):
        return None
    return {"answer_en": data.get("answer_en"),
            "answer_hi": data.get("answer_hi", ""),
            "source": "gemini"}
