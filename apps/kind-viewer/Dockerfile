# linux/amd64 image for AMD64 servers
FROM --platform=linux/amd64 node:22-bookworm-slim AS build

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/kind-viewer/package.json apps/kind-viewer/
COPY slides/kind-bp01/kind_presentation slides/kind-bp01/kind_presentation

RUN pnpm install --filter kind-viewer... --frozen-lockfile || pnpm install --filter kind-viewer...

COPY apps/kind-viewer apps/kind-viewer

RUN pnpm --filter kind-viewer build

FROM --platform=linux/amd64 node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5190
ENV KIND_ADMIN_SECRET=kindguy
ENV KIND_DB_PATH=/app/data/kind-viewer.sqlite
ENV KIND_DECK_ROOT=/app/deck
ENV KIND_COMMENTS_PATH=/app/data/kind-comments.json

COPY --from=build /repo/apps/kind-viewer/dist ./dist
COPY --from=build /repo/apps/kind-viewer/dist-server ./dist-server
COPY --from=build /repo/slides/kind-bp01/kind_presentation ./deck

RUN mkdir -p /app/data

EXPOSE 5190

CMD ["node", "dist-server/production.js"]
