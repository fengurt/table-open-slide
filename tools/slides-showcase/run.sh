#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PYTHON_BIN="${PYTHON:-}"
if [[ -z "${PYTHON_BIN}" ]]; then
  if command -v python3.12 >/dev/null 2>&1; then
    PYTHON_BIN="python3.12"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  else
    echo "Need python3.12+ (or set PYTHON=…)." >&2
    exit 1
  fi
fi

if [[ ! -d .venv ]]; then
  "${PYTHON_BIN}" -m venv .venv
fi

.venv/bin/pip install -q -r requirements.txt

exec .venv/bin/streamlit run app.py --server.port "${PORT:-8510}" "$@"
