#!/usr/bin/env bash
# Smart Health — start backend + frontend for local development (macOS/Linux).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting Smart Health (backend :8000, frontend :3000)..."

# Backend
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  ./.venv/bin/pip install -q -r requirements.txt
fi
./.venv/bin/python -m uvicorn app.main:app --reload --port 8000 &
BACK_PID=$!
trap 'kill $BACK_PID 2>/dev/null || true' EXIT

# Frontend
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
npm run dev
