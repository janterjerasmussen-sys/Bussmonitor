// Service Worker for Solbergliveien Monitor PWA
// Minimal pass-through – all data fetches go directly to network (real-time data must always be fresh)

const CACHE = 'solbergliveien-v1';

// Cache only the app shell on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['./trasop-monitor.html', './manifest.json', './icon.svg'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always fetch live data from Entur and MET Norway directly – never cache
  if (url.hostname.includes('entur.io') || url.hostname.includes('met.no')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For Google Fonts – network first, fall back to cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell – cache first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
