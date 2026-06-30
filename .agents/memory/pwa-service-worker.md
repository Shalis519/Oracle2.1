---
name: PWA service worker on authenticated SPA
description: Rules for the web app's service worker caching so it never leaks private/auth data
---

The web artifact is an installable PWA (manifest + `public/sw.js`, registered in `main.tsx` via `${import.meta.env.BASE_URL}sw.js`).

Rule: the service worker must NEVER cache authenticated/dynamic responses.

**Why:** A naive "cache all same-origin GET cache-first" SW will store user-scoped API JSON (and Clerk responses) in Cache Storage and replay them across sessions/users on the same device — stale data + cross-session leakage.

**How to apply:**
- Bypass (return without `respondWith`) any path containing `/api`, `__clerk`, or `/clerk` — let it hit the network.
- Navigations: network-first, fall back to the precached app shell (`self.registration.scope`) only when offline.
- Cache-first only for static `request.destination` of `script|style|image|font`.
- Bump `CACHE_NAME` when changing strategy so old caches are purged on activate.
- Use relative paths in the manifest (`start_url`/`scope` = `"."`, relative icon `src`) and register the SW with `import.meta.env.BASE_URL` so it works under path-based artifact routing.
