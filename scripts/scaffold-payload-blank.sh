#!/usr/bin/env bash
# Non-interactive Payload blank app (avoids hanging on DB prompts).
# Usage: ./scripts/scaffold-payload-blank.sh [project-name] [parent-dir]
# Default parent-dir is /tmp so the repo root is not littered.
set -euo pipefail

CPA_VERSION="${CPA_VERSION:-3.84.1}"
NAME="${1:-payload-scaffold-test}"
PARENT="${2:-/tmp}"
TARGET="${PARENT%/}/$NAME"

if [[ -e "$TARGET" ]]; then
  echo "Refusing to clobber existing path: $TARGET" >&2
  exit 1
fi

mkdir -p "$PARENT"
cd "$PARENT"

# Fewer prompts / spinner noise in CI and Cursor shells
export CI=1
export NODE_NO_WARNINGS=1

exec pnpm dlx "create-payload-app@${CPA_VERSION}" \
  -n "$NAME" \
  -t blank \
  --db postgres \
  --db-accept-recommended \
  --use-pnpm \
  --no-deps \
  --no-agent
