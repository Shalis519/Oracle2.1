---
name: Local dev outside Replit
description: What breaks (and what doesn't) when running this pnpm/Clerk/Vite/Express monorepo outside Replit, e.g. on a user's Windows machine.
---

- Clerk's proxy middleware (clerkProxyMiddleware) is production-only (`NODE_ENV !== "production"` short-circuits it). In dev, Clerk talks directly to its Frontend API, so Replit-managed Clerk's dev/test keys (pk_test/sk_test) work unmodified from localhost — no external Clerk account needed for local dev. Only the Auth pane (provider toggles, branding) still requires Replit.
- Replit's shared reverse proxy stitches artifacts (web + api-server) into one origin via path routing; outside Replit there is no such proxy, so the Vite dev server needs its own `server.proxy` for `/api` -> `http://localhost:<api-port>`. Guard it with `process.env.REPL_ID === undefined` so it stays inert inside Replit (where /api never reaches Vite anyway).
- `sh -c '...case $npm_config_user_agent...'`-style preinstall guards fail on native Windows (no `sh`). Replace with a plain `.mjs` script run via `node`, so it works in Git Bash, PowerShell, and cmd alike.
- `export VAR=value && next-command` in package.json scripts is bash-only and fails on Windows cmd.exe. Use `cross-env` / `cross-env-shell` for any script that needs to set an env var before a chained command.
- Artifact-injected env vars (PORT, BASE_PATH) that Replit's workflow system provides automatically have no equivalent locally; give the local "dev" script explicit defaults (e.g. `cross-env PORT=8080`) matching the artifact.toml's localPort so behavior matches Replit.
