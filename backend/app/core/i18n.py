"""Bilingual (English / Hindi) text helpers.

Every human-readable string the API emits carries both ``*_en`` and ``*_hi``
fields so the client can switch language instantly. ``pick`` resolves the
convenience single-language field when a ``lang`` query param is supplied.
"""
from __future__ import annotations

SUPPORTED = {"en", "hi"}


def pick(en: str, hi: str, lang: str = "en") -> str:
    return hi if lang == "hi" else en


def bilingual(en: str, hi: str, key: str) -> dict[str, str]:
    """Return ``{f"{key}_en": en, f"{key}_hi": hi}``."""
    return {f"{key}_en": en, f"{key}_hi": hi}


# Shared UI dictionary served at /api/meta/i18n (client also ships its own copy).
UI_STRINGS: dict[str, dict[str, str]] = {
    "app_title": {"en": "Smart Health", "hi": "स्मार्ट हेल्थ"},
    "dashboard": {"en": "Dashboard", "hi": "डैशबोर्ड"},
    "inventory": {"en": "Inventory", "hi": "इन्वेंटरी"},
    "forecast": {"en": "Forecast", "hi": "पूर्वानुमान"},
    "recommendations": {"en": "Recommendations", "hi": "सिफारिशें"},
    "alerts": {"en": "Alerts", "hi": "अलर्ट"},
    "reports": {"en": "Reports", "hi": "रिपोर्ट"},
    "beds": {"en": "Beds", "hi": "बेड"},
    "footfall": {"en": "Footfall", "hi": "मरीज संख्या"},
    "doctors": {"en": "Doctors", "hi": "डॉक्टर"},
    "tests": {"en": "Tests", "hi": "जांच"},
    "district": {"en": "District View", "hi": "जिला दृश्य"},
    "approve": {"en": "Approve", "hi": "स्वीकार करें"},
    "reject": {"en": "Reject", "hi": "अस्वीकार करें"},
    "healthy": {"en": "Healthy", "hi": "स्वस्थ"},
    "warning": {"en": "Warning", "hi": "चेतावनी"},
    "critical": {"en": "Critical", "hi": "गंभीर"},
}
