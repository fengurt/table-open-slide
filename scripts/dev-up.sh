#!/usr/bin/env bash
# Documented local dev entrypoint: Postgres + CMS + marketing web + slides demo.
# Ports: 5432 (Postgres), 3000 (web), 3001 (cms), 5173 (open-slide demo)
# MCP server is stdio-only — wire `apps/mcp-server/dist/index.js` in Cursor MCP settings (no TCP port).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

free_port_if_listening() {
  local port="$1"
  local pids
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Port $port in use; stopping: $pids"
    kill $pids 2>/dev/null || true
    sleep 0.5
  fi
}

for p in 5432 3000 3001 5173; do
  free_port_if_listening "$p"
done

if command -v docker >/dev/null 2>&1; then
  docker compose -f "$ROOT/docker-compose.yml" up -d postgres 2>/dev/null || true
fi

export PORT="${PORT:-3000}"
export CMS_PORT="${CMS_PORT:-3001}"
export OPENSLIDE_PORT="${OPENSLIDE_PORT:-5173}"

echo "Starting web :$PORT, cms :$CMS_PORT, demo :$OPENSLIDE_PORT …"
# Next.js treats `next dev -- -p N` oddly (can interpret `-p` as a directory). Use PORT per process.
pnpm exec concurrently -k \
  -n web,cms,demo \
  -c blue,magenta,yellow \
  "env PORT=$PORT pnpm --filter web dev" \
  "env PORT=$CMS_PORT pnpm --filter cms dev" \
  "pnpm --filter demo dev -- -p $OPENSLIDE_PORT"
