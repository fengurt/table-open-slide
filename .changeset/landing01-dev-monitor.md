---
"@open-slide/core": patch
---

Add dev-only `/api/landing01-files` and `/api/landing01-raw` routes, watch `landing01` for HMR pings, allow that folder in Vite `server.fs.allow`, and resolve `landing01` from the slide project cwd (`./landing01`, `../../landing01`, or `../landing01`).
