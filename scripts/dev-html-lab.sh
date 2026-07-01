#!/usr/bin/env bash
# Content studio (html-lab + docx-master API) — documented entrypoint.
# Default: http://localhost:3333  (vite.config.ts server.port)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Load .env (then .env.local overrides) so DOCX_STUDIO_TOKEN / ADMIN_PASSWORD /
# SETTINGS_FILE / DOCX_MASTER_AI_* are picked up for secured local dev without
# typing them inline. Only simple KEY=VALUE lines are exported; existing
# environment values win (so `FOO=bar pnpm dev:docx-lab` still overrides .env).
load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" == export\ * ]] && line="${line#export }"
    [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
    local key="${line%%=*}"
    local val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    if [[ -z "${!key:-}" ]]; then
      export "$key=$val"
    fi
  done <"$file"
}
load_env_file "$ROOT/.env"
load_env_file "$ROOT/.env.local"

PORT="${HTML_LAB_PORT:-3333}"
PREVIEW_PORT="${HTML_LAB_PREVIEW_PORT:-3334}"

is_html_lab_process() {
  local pid="$1"
  local cmd cwd args
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1 || true)"
  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"

  # cwd directly inside the html-lab package is a strong signal.
  if [[ "$cwd" == *"/apps/html-lab"* ]]; then
    return 0
  fi
  # Otherwise require an html-lab/vite signature in the command line. A bare
  # "cwd under repo root" is intentionally NOT enough — sibling dev servers
  # (kind-viewer, taiyuan-storyline, web) also run from the repo root and must
  # not be killed just for sharing this port.
  if echo "$cmd $args" | grep -qE "html-lab|apps/html-lab|vite.*:${PORT}|pnpm.*html-lab|turbo.*html-lab"; then
    return 0
  fi
  return 1
}

free_port_if_same_service() {
  local port="$1"
  local label="$2"
  local pids pid

  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi

  for pid in $pids; do
    if is_html_lab_process "$pid"; then
      echo "[$label] Port $port in use by previous html-lab (pid $pid) — stopping"
      kill "$pid" 2>/dev/null || true
    else
      local cmd
      cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
      echo "[$label] Port $port held by unrelated process (pid $pid):" >&2
      echo "  $cmd" >&2
      echo "Set HTML_LAB_PORT to another port, or stop that process manually." >&2
      exit 1
    fi
  done

  sleep 0.6

  if lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[$label] Port $port still busy after stop — retrying with SIGKILL" >&2
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 0.3
  fi
}

wait_for_port() {
  local port="$1"
  local tries="${2:-40}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

free_port_if_same_service "$PORT" "dev"
free_port_if_same_service "$PREVIEW_PORT" "preview"

URL="http://localhost:${PORT}/"
echo ""
echo "Content studio → $URL"
echo "  Hub + document library:  /"
echo "  Word (docx-master):      /docx"
echo "  Admin (LLM keys):        /admin"
echo "  HTML Lab:                /lab"
if [[ -n "${DOCX_STUDIO_TOKEN:-}" ]]; then
  echo "  Auth:                    token required (DOCX_STUDIO_TOKEN set)"
fi
if [[ -n "${DOCX_STUDIO_ADMIN_PASSWORD:-}" ]]; then
  echo "  Admin login:             enabled (DOCX_STUDIO_ADMIN_PASSWORD set)"
fi
echo ""

if [[ "${OPEN_BROWSER:-1}" != "0" ]]; then
  ( wait_for_port "$PORT" 60 && open "$URL" ) &
fi

exec env HTML_LAB_PORT="$PORT" pnpm --filter html-lab dev
