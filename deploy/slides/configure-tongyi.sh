#!/usr/bin/env bash
# Inject Tongyi (Bailian Token Plan) LLM into slides.opcglobal.cn via admin API.
# Key is read from 1Password at runtime — never written to disk or git.
#
# Usage:
#   ./deploy/slides/configure-tongyi.sh
#   TONGYI_MODEL=qwen3.7-plus ./deploy/slides/configure-tongyi.sh
set -euo pipefail

DOMAIN="${DOMAIN:-https://slides.opcglobal.cn}"
SSH_HOST="${SSH_HOST:-opchom}"
REMOTE_DIR="${REMOTE_DIR:-/opt/slides}"
TONGYI_BASE="${TONGYI_BASE_URL:-https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1}"
TONGYI_MODEL="${TONGYI_MODEL:-qwen3.7-max}"
KEY_SCRIPT="${HOME}/.cursor/skills/ali-tongyi/scripts/load_key.sh"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

if [[ ! -f "$KEY_SCRIPT" ]]; then
  echo "Missing $KEY_SCRIPT — install ali-tongyi skill first." >&2
  exit 1
fi

say "Loading Tongyi seat key from 1Password (Touch ID may prompt)"
# shellcheck disable=SC1090
source "$KEY_SCRIPT"
if [[ -z "${DASHSCOPE_API_KEY:-}" ]]; then
  echo "DASHSCOPE_API_KEY empty — unlock 1Password and retry." >&2
  exit 1
fi
echo "    Key loaded (${#DASHSCOPE_API_KEY} chars, prefix ${DASHSCOPE_API_KEY:0:6}…)"

say "Reading admin password from $SSH_HOST:$REMOTE_DIR/.env"
ADMIN_PW=$(ssh "$SSH_HOST" "grep '^DOCX_STUDIO_ADMIN_PASSWORD=' '$REMOTE_DIR/.env' | cut -d= -f2-")
if [[ -z "$ADMIN_PW" ]]; then
  echo "DOCX_STUDIO_ADMIN_PASSWORD not set on server." >&2
  exit 1
fi

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

say "Admin login"
LOGIN=$(curl -fsS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d "{\"password\":\"$ADMIN_PW\"}" \
  "$DOMAIN/api/docx/admin/login")
echo "$LOGIN" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("ok"), d; print("    logged in")'

say "Save Tongyi provider ($TONGYI_MODEL)"
export TONGYI_BASE TONGYI_MODEL
SAVE=$(curl -fsS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -X PUT \
  -d "$(python3 -c 'import json,os; print(json.dumps({"providers":[{"id":"tongyi","baseUrl":os.environ["TONGYI_BASE"],"model":os.environ["TONGYI_MODEL"],"apiKey":os.environ["DASHSCOPE_API_KEY"]}]}))')" \
  "$DOMAIN/api/docx/admin/llm")
echo "$SAVE" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("    saved", d.get("providerCount",0), "provider(s), source=", d.get("status",{}).get("source"))'

say "LLM smoke test"
TEST=$(curl -fsS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$DOMAIN/api/docx/admin/llm/test")
echo "$TEST" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("ok"), d; print("    ok via", d.get("provider"), "(" + str(d.get("model")) + ") ->", repr((d.get("reply") or "")[:60]))'

say "Public llm-status"
STUDIO_TOKEN=$(ssh "$SSH_HOST" "grep '^DOCX_STUDIO_TOKEN=' '$REMOTE_DIR/.env' | cut -d= -f2-" 2>/dev/null || true)
if [[ -n "${STUDIO_TOKEN:-}" ]]; then
  curl -fsS -H "Authorization: Bearer $STUDIO_TOKEN" "$DOMAIN/api/docx/llm-status" | python3 -m json.tool
else
  echo "    (skipped — no studio token on server)"
fi
say "Done — Tongyi configured on $DOMAIN"
