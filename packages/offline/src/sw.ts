// Service Worker for Lumo Offline Learning Module
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'lumo-offline-v1';
const APP_SHELL = [
  '/',
  '/packages/embed-sdk/dist/lumo.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600&display=swap'
];

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[Lumo SW] App shell precache notice:', err);
      });
    })
  );
  sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  sw.clients.claim();
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // 1. Cache-First for downloaded offline packages & media samples
  if (url.pathname.includes('/offline-packages/') || url.pathname.includes('/samples/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate for application shell & assets
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));

      return cached || networkPromise;
    })
  );
});
