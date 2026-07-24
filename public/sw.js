// Caches only the static, unauthenticated app shell — the marketing page,
// sign-in, manifest, and icons — plus Next's content-hashed static assets.
// Everything else (every /api/* call and every authenticated page, which is
// nearly the whole app) is network-only and never touches the cache, so a
// session can never be served stale or to the wrong person.
const CACHE_NAME = "rounds-shell-v1";
const SHELL_URLS = ["/", "/sign-in", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Immutable hashed build assets: safe to cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Never cache API calls or authenticated pages — always hit the network.
  if (url.pathname.startsWith("/api/")) return;

  // Shell pages: network-first so signed-in users always see live nav
  // state, falling back to the cached shell only when truly offline.
  if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((cached) => cached ?? Response.error())),
    );
  }
});
