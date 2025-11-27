const CACHE_NAME = "sentira-v1";

// Files to cache for offline shell (update this list as needed)
const APP_SHELL = [
  "./",
  "./index.html",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
];

// Install: cache basic app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static files
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // For your backend API calls, prefer network (so data is fresh)
  if (url.origin.includes("sentira-backend.onrender.com")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For static files, cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        // Don't cache opaque / invalid responses
        if (!response || response.status !== 200) {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
