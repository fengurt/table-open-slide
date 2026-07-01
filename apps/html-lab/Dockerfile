# apps/html-lab — Content studio + docx-master API (production image)
FROM --platform=linux/amd64 node:22-bookworm-slim AS build

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# html-lab + docx pipeline deps
COPY apps/html-lab/package.json apps/html-lab/
COPY apps/docx-mcp-server/package.json apps/docx-mcp-server/
COPY skills/tableai-docx-master skills/tableai-docx-master
COPY skills/tableai-guizang-ppt-skill/demo/atelier-showcase skills/tableai-guizang-ppt-skill/demo/atelier-showcase
COPY modules/atelier-brand modules/atelier-brand
COPY modules/kind-brand modules/kind-brand
COPY modules/kind-press-brand modules/kind-press-brand
COPY modules/chaoyang-brand modules/chaoyang-brand
COPY modules/tableai-brand modules/tableai-brand
COPY modules/microsoft-brand modules/microsoft-brand
COPY modules/school-spirit modules/school-spirit

RUN pnpm install --filter html-lab... --filter docx-mcp-server... --frozen-lockfile \
  || pnpm install --filter html-lab... --filter docx-mcp-server...

COPY apps/html-lab apps/html-lab
COPY apps/docx-mcp-server apps/docx-mcp-server

RUN pnpm --filter html-lab build && pnpm --filter docx-mcp-server build

# --- runtime ---
FROM --platform=linux/amd64 node:22-bookworm-slim AS runtime

# CJK fonts (fonts-noto-cjk*) are required or LibreOffice renders Chinese as
# tofu (□) in the server-side PDF/PNG previews. fontconfig + fc-cache make the
# fonts discoverable. The .docx itself only stores font *names*, so a user's
# Word is unaffected; only the on-server preview pipeline needs these installed.
RUN apt-get update \
  && (apt-get install -y --no-install-recommends --fix-missing \
    libreoffice-writer \
    poppler-utils \
    libxml2-utils \
    unzip \
    ca-certificates \
    fontconfig \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-dejavu-core \
    || (apt-get update && apt-get install -y --no-install-recommends --fix-missing \
      libreoffice-writer poppler-utils libxml2-utils unzip ca-certificates \
      fontconfig fonts-noto-cjk fonts-noto-cjk-extra fonts-dejavu-core)) \
  && rm -rf /var/lib/apt/lists/*

# Vendored brand TTFs (e.g. Manrope) — copied if present, then registered.
# Safe no-op when the directory is absent.
COPY apps/html-lab/fonts/ /usr/share/fonts/truetype/brand/
RUN fc-cache -f \
  && fc-list | grep -iE 'noto|cjk' >/dev/null 2>&1 \
    && echo 'CJK fonts registered' || echo 'WARN: CJK fonts not found'

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/apps/html-lab ./apps/html-lab
COPY --from=build /repo/apps/docx-mcp-server ./apps/docx-mcp-server
COPY --from=build /repo/skills/tableai-docx-master ./skills/tableai-docx-master
COPY skills/tableai-guizang-ppt-skill/demo/atelier-showcase ./skills/tableai-guizang-ppt-skill/demo/atelier-showcase
COPY --from=build /repo/modules ./modules

# Retention sweeper (node-builtins only) — used by the docx-cleanup service.
COPY scripts/cleanup-out.mjs ./scripts/cleanup-out.mjs

# `vite preview` bundles vite.config.ts into a sibling `.timestamp-*.mjs` temp
# file in the app dir, so `node` must own it (not just /repo/out) or it crashes
# with EACCES on startup.
RUN mkdir -p /repo/out /repo/slides/projects \
  && chown -R node:node /repo/out /repo/apps/html-lab /repo/slides

USER node

EXPOSE 3333

# Vite preview serves built html-lab + docx REST APIs.
# Use `pnpm exec` (not `run preview --`) so the flags reach vite directly;
# a stray `--` makes vite treat them as positional and ignore --port, falling
# back to the config's preview.port (3334) and missing the published 3333.
CMD ["pnpm", "--filter", "html-lab", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "3333", "--strictPort"]
