#!/usr/bin/env bash
# Sparse clone / pull fengurt/tableai-ppt-master (skills only, no example PPTX blobs)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/modules/tableai-ppt-master"
REMOTE="${TABLEAI_PPT_MASTER_REMOTE:-https://github.com/fengurt/tableai-ppt-master.git}"
SPARSE_DIRS=(skills projects .github .claude-plugin)

clone_sparse() {
  rm -rf "$TARGET"
  git clone --filter=blob:none --sparse --depth 1 "$REMOTE" "$TARGET"
  cd "$TARGET"
  git sparse-checkout init --cone
  git sparse-checkout set "${SPARSE_DIRS[@]}"
  # Root agent entrypoints (small files)
  git checkout HEAD -- AGENTS.md CLAUDE.md README.md README_CN.md requirements.txt \
    index.html viewer.html .env.example .gitignore LICENSE CONTRIBUTING.md \
    CODE_OF_CONDUCT.md SECURITY.md 2>/dev/null || true
}

if [[ ! -d "$TARGET/.git" ]]; then
  echo "→ Cloning $REMOTE (sparse: ${SPARSE_DIRS[*]})"
  clone_sparse
else
  echo "→ Pulling $TARGET"
  cd "$TARGET"
  git sparse-checkout init --cone 2>/dev/null || true
  git sparse-checkout set "${SPARSE_DIRS[@]}" 2>/dev/null || true
  if ! git pull --depth 1 origin main; then
    echo "⚠ pull failed; re-cloning sparse…"
    cd "$ROOT"
    clone_sparse
  fi
fi

# Drop heavy paths if a prior full checkout left them behind
rm -rf "$TARGET/examples" "$TARGET/docs/assets" 2>/dev/null || true

echo "✓ ppt-master module ready at $TARGET/skills/ppt-master"
du -sh "$TARGET/skills" 2>/dev/null || true
