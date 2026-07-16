const CACHE = 'rise-resources-v1';

// Files to cache for offline use
const PRECACHE = [
  './community_resources.html',
  './manifest.json'
];

// On install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// On activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On fetch: serve from cache, fall back to network
self.addEventListener('fetch', e => {
  // Only cache same-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, return the main HTML page
        if (e.request.destination === 'document') {
          return caches.match('./community_resources.html');
        }
      });
    })
  );
});
