#!/usr/bin/env bash
# Deploy docx-studio to slides.opcglobal.cn on opc-hom-01 (119.45.123.57, ap-nanjing).
#
# Pattern: amd64 image built locally -> shipped via `docker save | ssh docker load`
# -> run on 127.0.0.1:3333 -> host nginx vhost + certbot TLS. Nothing public except
# via nginx. Idempotent: re-running ships a fresh image and recreates the container.
#
# Usage:
#   ./deploy/slides/deploy.sh              # full deploy (build, ship, run, nginx, tls)
#   ./deploy/slides/deploy.sh --dry-run    # validate config and print planned actions
#   SKIP_BUILD=1 ./deploy/slides/deploy.sh # reuse existing local image
#   SKIP_TLS=1   ./deploy/slides/deploy.sh # skip certbot (e.g. DNS not propagated)
set -euo pipefail

# --- config ---------------------------------------------------------------
SSH_HOST="${SSH_HOST:-opchom}"          # ~/.ssh/config alias -> root@119.45.123.57
DOMAIN="${DOMAIN:-slides.opcglobal.cn}"
IMAGE="${IMAGE:-table-slides01-docx-studio:latest}"
REMOTE_DIR="${REMOTE_DIR:-/opt/slides}"
TLS_EMAIL="${TLS_EMAIL:-admin@opcglobal.cn}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/deploy/slides"
DRY_RUN=0

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

usage() {
  cat <<'EOF'
Usage: deploy/slides/deploy.sh [--dry-run]

Environment:
  SSH_HOST       SSH alias/host for the Tencent server. Default: opchom
  DOMAIN         Public domain. Default: slides.opcglobal.cn
  IMAGE          Local Docker image tag. Default: table-slides01-docx-studio:latest
  REMOTE_DIR     Remote deploy directory. Default: /opt/slides
  TLS_EMAIL      Certbot email. Default: admin@opcglobal.cn
  SKIP_BUILD=1   Reuse an existing local image.
  SKIP_TLS=1     Skip certbot.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
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

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

require_file "$REPO_ROOT/apps/html-lab/Dockerfile"
require_file "$HERE/docker-compose.slides.yml"
require_file "$HERE/nginx-slides.opcglobal.cn.conf"

if [[ "$DRY_RUN" == "1" ]]; then
  say "Dry run: deployment plan"
  echo "Repo:       $REPO_ROOT"
  echo "SSH host:   $SSH_HOST"
  echo "Domain:     $DOMAIN"
  echo "Image:      $IMAGE"
  echo "Remote dir: $REMOTE_DIR"
  echo "TLS email:  $TLS_EMAIL"
  echo "Skip build: ${SKIP_BUILD:-0}"
  echo "Skip TLS:   ${SKIP_TLS:-0}"
  echo ""
  echo "Would build: docker buildx build --platform linux/amd64 -f apps/html-lab/Dockerfile -t $IMAGE --load ."
  echo "Would ship:  docker save $IMAGE | gzip -1 | rsync --partial --append ... $SSH_HOST:$REMOTE_DIR/"
  echo "Would run:   ssh $SSH_HOST 'cd $REMOTE_DIR && docker compose -f docker-compose.slides.yml up -d --force-recreate slides'"
  echo "Would proxy: install nginx vhost for $DOMAIN -> 127.0.0.1:3333"
  if [[ "${SKIP_TLS:-}" != "1" ]]; then
    echo "Would TLS:   certbot --nginx -d $DOMAIN -m $TLS_EMAIL --redirect"
  fi
  exit 0
fi

# --- 1. build amd64 image -------------------------------------------------
if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  say "Building $IMAGE (linux/amd64)"
  docker buildx build --platform linux/amd64 \
    -f "$REPO_ROOT/apps/html-lab/Dockerfile" \
    -t "$IMAGE" --load "$REPO_ROOT"
else
  say "SKIP_BUILD=1 — using existing local $IMAGE"
fi

# --- 2. ship image to server (resumable rsync — pipe transfer drops on slow uplinks) ---
TAR="/tmp/slides-image-$$.tar.gz"
cleanup_tar() { rm -f "$TAR"; }
trap cleanup_tar EXIT
say "Saving $IMAGE to $TAR"
docker save "$IMAGE" | gzip -1 > "$TAR"
say "Rsync to $SSH_HOST:$REMOTE_DIR/ (resumes on drop)"
REMOTE_TAR="$REMOTE_DIR/slides-image-$(date +%s).tar.gz"
n=0
until rsync --partial --append --timeout=90 \
  -e 'ssh -o ServerAliveInterval=20 -o ServerAliveCountMax=6' \
  "$TAR" "$SSH_HOST:$REMOTE_TAR"; do
  n=$((n + 1))
  [[ $n -ge 30 ]] && { echo "rsync failed after 30 retries"; exit 1; }
  echo "[retry $n] rsync dropped, resuming in 5s..."
  sleep 5
done
say "docker load on server (detached — survives SSH drop)"
ssh "$SSH_HOST" "rm -f $REMOTE_DIR/load.exit && setsid bash -c 'set -o pipefail; gunzip -c $REMOTE_TAR | docker load > $REMOTE_DIR/load.log 2>&1; echo \$? > $REMOTE_DIR/load.exit' </dev/null &"
for _ in $(seq 1 90); do
  if ssh "$SSH_HOST" "test -f $REMOTE_DIR/load.exit"; then break; fi
  sleep 10
done
ssh "$SSH_HOST" "test \"\$(cat $REMOTE_DIR/load.exit 2>/dev/null)\" = 0 && docker image inspect $IMAGE >/dev/null" || {
  echo "docker load did not finish — check $REMOTE_DIR/load.log on server"
  exit 1
}

# --- 3. push compose + env, bring container up ---------------------------
say "Syncing compose + env to $SSH_HOST:$REMOTE_DIR"
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
scp "$HERE/docker-compose.slides.yml" "$SSH_HOST:$REMOTE_DIR/docker-compose.slides.yml"
# Only push .env if the server doesn't already have one (don't clobber secrets).
if ! ssh "$SSH_HOST" "test -f $REMOTE_DIR/.env"; then
  say "No remote .env — generating one with a fresh token"
  TOKEN="$(openssl rand -hex 24)"
  ADMINPW="$(openssl rand -hex 16)"
  ssh "$SSH_HOST" "cat > $REMOTE_DIR/.env" <<EOF
DOCX_STUDIO_TOKEN=$TOKEN
DOCX_STUDIO_ADMIN_PASSWORD=$ADMINPW
SLIDES_PORT=3333
DOCX_RETENTION_DAYS=30
EOF
  echo "    Generated DOCX_STUDIO_TOKEN=$TOKEN"
  echo "    Generated DOCX_STUDIO_ADMIN_PASSWORD=$ADMINPW"
fi

say "Starting container"
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose -f docker-compose.slides.yml up -d --force-recreate slides"

# --- 4. host nginx vhost --------------------------------------------------
say "Installing nginx vhost for $DOMAIN"
scp "$HERE/nginx-slides.opcglobal.cn.conf" "$SSH_HOST:/etc/nginx/sites-available/$DOMAIN"
ssh "$SSH_HOST" "ln -sf ../sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN && nginx -t && systemctl reload nginx"

# --- 5. certbot TLS -------------------------------------------------------
if [[ "${SKIP_TLS:-}" != "1" ]]; then
  say "Requesting/renewing TLS cert via certbot"
  ssh "$SSH_HOST" "certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $TLS_EMAIL --redirect || echo 'certbot failed — check DNS propagation, re-run with SKIP_BUILD=1'"
fi

# --- 6. verify ------------------------------------------------------------
say "Verifying"
ssh "$SSH_HOST" "curl -fsS -o /dev/null -w 'local container: %{http_code}\n' http://127.0.0.1:3333/api/docx/auth-status || true"
curl -fsS -o /dev/null -w "public https: %{http_code}\n" "https://$DOMAIN/api/docx/auth-status" || \
  echo "public https not reachable yet (DNS/cert may still be propagating)"
say "Done — https://$DOMAIN"
