const CACHE_NAME = 'red-vecinal-v101';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Elimina absolutamente todas las cachés anteriores para forzar la actualización en celulares
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass para APIs y llamadas dinámicas
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/actuator/')) {
    return;
  }

  // Network-First para navegación y HTML: siempre busca la versión más reciente del servidor
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First con fallback a red para recursos estáticos
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
