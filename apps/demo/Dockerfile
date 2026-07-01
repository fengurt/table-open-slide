# Self-host the open-slide demo decks (incl. 餐饮盈利突围 Day1/Day2) as a static SPA.
# Build context MUST be the repo root: `docker build -f apps/demo/Dockerfile .`
FROM node:22-bookworm-slim AS build

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Manifests first for cached installs. core/bin.js must exist at install time so
# pnpm links the `open-slide` CLI bin (it skips bins whose target is missing).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/bin.js packages/core/
COPY apps/demo/package.json apps/demo/

RUN pnpm install --filter demo... --frozen-lockfile || pnpm install --filter demo...

# Sources.
COPY packages/core packages/core
COPY apps/demo apps/demo

# Core ships the `open-slide` CLI used by the demo build — build it first.
RUN pnpm --filter @open-slide/core build \
  && pnpm --filter demo build

# ---- runtime: tiny static host with SPA fallback ----
FROM nginx:1.27-alpine AS runtime

COPY apps/demo/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/demo/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
