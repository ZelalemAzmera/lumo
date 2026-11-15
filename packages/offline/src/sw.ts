/**
 * Lumo Workbox Service Worker
 * Implements Workbox CacheFirst strategy for offline learning media and
 * StaleWhileRevalidate for application assets with graceful native fallback.
 */

// Service Worker scope
const sw = self as any;

const CACHE_NAME = 'lumo-offline-v1';
const APP_SHELL = [
  '/',
  '/packages/embed-sdk/dist/lumo.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600&display=swap'
];

// 1. Attempt to load Google Chrome Workbox from CDN
try {
  sw.importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
} catch (e) {
  // Network unavailable during offline installation
}

if (typeof sw.workbox !== 'undefined') {
  const wb = sw.workbox;
  wb.setConfig({ debug: false });

  // Precache app shell
  wb.precaching.precacheAndRoute([
    { url: '/', revision: '1' },
    { url: '/packages/embed-sdk/dist/lumo.min.js', revision: '1' }
  ]);

  // Media & offline packages: Workbox CacheFirst Strategy
  wb.routing.registerRoute(
    ({ url }: { url: URL }) =>
      url.pathname.includes('/offline-packages/') ||
      url.pathname.includes('/samples/') ||
      url.pathname.endsWith('.mp4') ||
      url.pathname.endsWith('.mp3') ||
      url.pathname.endsWith('.vtt'),
    new wb.strategies.CacheFirst({
      cacheName: 'lumo-media-cache-v1',
      plugins: [
        new wb.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        new wb.expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
      ]
    })
  );

  // App shell and assets: Workbox StaleWhileRevalidate Strategy
  wb.routing.registerRoute(
    ({ request }: { request: Request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'document',
    new wb.strategies.StaleWhileRevalidate({
      cacheName: 'lumo-assets-cache-v1'
    })
  );
} else {
  // 2. Native ServiceWorker Cache API Fallback (when Workbox CDN is unreachable)
  sw.addEventListener('install', (event: any) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(APP_SHELL).catch((err) => {
          console.warn('[Lumo SW] App shell precache notice:', err);
        });
      })
    );
    sw.skipWaiting();
  });

  sw.addEventListener('activate', (event: any) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME && !key.startsWith('lumo-')).map((key) => caches.delete(key))
        );
      })
    );
    sw.clients.claim();
  });

  sw.addEventListener('fetch', (event: any) => {
    const url = new URL(event.request.url);

    // Cache-First for media & offline packages
    if (
      url.pathname.includes('/offline-packages/') ||
      url.pathname.includes('/samples/') ||
      url.pathname.endsWith('.mp4') ||
      url.pathname.endsWith('.mp3') ||
      url.pathname.endsWith('.vtt')
    ) {
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

    // Stale-While-Revalidate for other assets
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
}
export {};
