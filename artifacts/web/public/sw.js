const CACHE_NAME = "aether-oracle-v2";

// Cache only static, non-sensitive assets. Never cache API or auth responses.
const STATIC_DESTINATIONS = new Set(["script", "style", "image", "font"]);

function isDynamicPath(pathname) {
  return (
    pathname.includes("/api") ||
    pathname.includes("__clerk") ||
    pathname.includes("/clerk")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // Precache the app shell entry for offline navigation fallback.
        await cache.add(new Request(self.registration.scope, { cache: "reload" }));
      } catch {
        // Best-effort precache; ignore failures.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API or auth traffic — always go to the network.
  if (isDynamicPath(url.pathname)) return;

  // App-shell: network-first for page navigations, fall back to cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (err) {
          const shell = await caches.match(self.registration.scope);
          if (shell) return shell;
          const cached = await caches.match(request);
          if (cached) return cached;
          throw err;
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first with background refresh.
  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
    return;
  }

  // Everything else: let the browser handle it normally (no caching).
});
