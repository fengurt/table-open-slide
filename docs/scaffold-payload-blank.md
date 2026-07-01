# Non-interactive `create-payload-app` (why it hung)

The CLI uses interactive prompts for **database** and **connection string** unless you pass flags. In CI or Cursor shell runs without a TTY, it sits on “Select a database” until aborted (no output flushed to the log).

## Working one-liner (blank + Postgres + skip install)

From any directory (writes `./<project-name>/` under your **current** working directory):

```bash
pnpm dlx create-payload-app@3.84.1 \
  -n my-payload-app \
  -t blank \
  --db postgres \
  --db-accept-recommended \
  --use-pnpm \
  --no-deps \
  --no-agent
```

Pin the version (e.g. `3.84.1`) to match this repo’s Payload apps and skip repeated “latest” resolution.

- `--db postgres` — valid values: `mongodb`, `postgres`, `sqlite`, `vercel-postgres`, `d1-sqlite`
- `--db-accept-recommended` — use the generated default URI (no second prompt)
- Or set an explicit URI: `--db-connection-string 'postgres://user:pass@127.0.0.1:5432/dbname'`

Then `cd my-payload-app && pnpm install && pnpm dev`.

## From this repo

Defaults to **`/tmp`** so nothing is created inside the workspace. Override the CLI version with **`CPA_VERSION`** if needed.

```bash
pnpm scaffold:payload                    # → /tmp/payload-scaffold-test
pnpm scaffold:payload my-app             # → /tmp/my-app
./scripts/scaffold-payload-blank.sh x .  # parent dir `.` = current directory
CPA_VERSION=3.84.1 pnpm scaffold:payload # same as default; bump when you bump Payload
```

## Repo note

This monorepo already ships **`apps/cms`**; use the script above only for a **throwaway** scaffold or to diff against upstream templates.
