const CACHE_NAME = 'entre-vecinos-v84';
const TILE_CACHE = 'tiles-v1';
const MAX_TILES = 1500;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete all older caches to ensure phones see the newest design immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== TILE_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo GET y http(s): cache.put falla con POST u otros esquemas
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Tiles del mapa: cache-first, para ver el mapa de zonas ya visitadas sin internet
  const url = new URL(event.request.url);
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const hit = await cache.match(event.request);
        if (hit) return hit;
        try {
          const res = await fetch(event.request);
          if (res.ok || res.type === 'opaque') {
            await cache.put(event.request, res.clone());
            // Limitar tamaño del cache de tiles (borra los más antiguos)
            const keys = await cache.keys();
            if (keys.length > MAX_TILES) {
              await Promise.all(keys.slice(0, keys.length - MAX_TILES).map((k) => cache.delete(k)));
            }
          }
          return res;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Network first: always try to get the freshest live version from the server
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: when there is NO internet, serve from local cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
