#!/usr/bin/env bash
# Upload landing01/dong/dist to Tencent Cloud COS (coscli).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${ROOT}/landing01/dong/dist"
HTML="${DIST}/dongreport20260525.html"

DRY_RUN=0
PACK_ONLY=0

usage() {
  cat <<'EOF'
Usage: scripts/deploy-dong-tencent-cos.sh [--dry-run] [--pack-only]

Options:
  --dry-run    Pack and print the coscli upload command without uploading.
  --pack-only  Pack landing01/dong/dist and exit before COS checks.

Environment:
  TENCENT_COS_BUCKET       Required for upload/dry-run, e.g. my-bucket-1250000000
  TENCENT_COS_REGION       Required for upload/dry-run, e.g. ap-guangzhou
  TENCENT_COS_PREFIX       Optional upload prefix, default: dong/
  TENCENT_SECRET_ID        Optional coscli credential override
  TENCENT_SECRET_KEY       Optional coscli credential override
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --pack-only)
      PACK_ONLY=1
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

PREFIX="${TENCENT_COS_PREFIX:-dong/}"
SECRET_ID="${TENCENT_SECRET_ID:-}"
SECRET_KEY="${TENCENT_SECRET_KEY:-}"

cd "$ROOT"
node scripts/pack-dong-report.mjs

if [[ "$PACK_ONLY" == "1" ]]; then
  echo "Pack complete: ${HTML}"
  exit 0
fi

: "${TENCENT_COS_BUCKET:?Set TENCENT_COS_BUCKET (e.g. my-bucket-1250000000)}"
: "${TENCENT_COS_REGION:?Set TENCENT_COS_REGION (e.g. ap-guangzhou)}"

if ! command -v coscli >/dev/null 2>&1; then
  echo "coscli not found. Pack ready at: ${HTML}"
  echo "Upload manually in COS console, or install: https://cloud.tencent.com/document/product/436/63143"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "Dry run target: cos://${TENCENT_COS_BUCKET}/${PREFIX}"
    exit 0
  fi
  exit 1
fi

COSCLI_CFG=()

if [[ -n "$SECRET_ID" && -n "$SECRET_KEY" ]]; then
  CONFIG="$(mktemp)"
  trap 'rm -f "$CONFIG"' EXIT
  cat >"$CONFIG" <<EOF
cos:
  base:
    secretid: "${SECRET_ID}"
    secretkey: "${SECRET_KEY}"
    sessiontoken: ""
    protocol: https
  buckets:
    - name: "${TENCENT_COS_BUCKET}"
      alias: dong
      region: "${TENCENT_COS_REGION}"
      endpoint: "cos.${TENCENT_COS_REGION}.myqcloud.com"
EOF
  COSCLI_CFG=(--config-path "$CONFIG")
else
  echo "Tip: set TENCENT_SECRET_ID and TENCENT_SECRET_KEY, or rely on ~/.cos.yaml"
fi

TARGET="cos://${TENCENT_COS_BUCKET}/${PREFIX}"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run: would upload ${DIST}/ to ${TARGET}"
  printf 'Command: coscli'
  printf ' %q' "${COSCLI_CFG[@]}" cp "$DIST/" "$TARGET" --recursive --force
  printf '\n'
else
  coscli "${COSCLI_CFG[@]}" cp "$DIST/" "$TARGET" --recursive --force
fi

echo ""
if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run complete."
else
  echo "Upload complete."
fi
echo "Static website URL (if enabled):"
echo "  https://${TENCENT_COS_BUCKET}.cos-website.${TENCENT_COS_REGION}.myqcloud.com/${PREFIX}dongreport20260525.html"
