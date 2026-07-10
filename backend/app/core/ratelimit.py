"""Rate limiting, wired to degrade gracefully.

slowapi is the intended backend, but the live demo must never fail to boot just
because an optional dependency is missing. If the import fails we fall back to a
no-op limiter whose ``.limit`` decorator returns the endpoint unchanged, so every
route keeps working (just without throttling).
"""
from __future__ import annotations

try:  # pragma: no cover - exercised implicitly; fallback is the interesting path
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
    SLOWAPI_ENABLED = True
except Exception:  # noqa: BLE001 - any import/runtime failure must not break boot
    SLOWAPI_ENABLED = False

    class _NoopLimiter:
        """Stand-in with the same ``.limit`` surface, but does nothing."""

        def limit(self, *_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

    limiter = _NoopLimiter()
