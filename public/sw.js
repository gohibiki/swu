// Service Worker for swutcg.one â€” Offline support + caching.
// Bump CACHE_VERSION whenever the static asset contract changes; old
// caches are deleted on activate.
const CACHE_VERSION = 'swu-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE   = `${CACHE_VERSION}-data`;
const IMAGE_CACHE  = `${CACHE_VERSION}-images`;

// Routes precached on install so cold repeat visits to the most-used
// pages skip the network entirely.
const STATIC_ASSETS = [
  '/',
  '/database',
  '/builder',
  '/decklists',
  '/how-to-play',
  '/fonts/eurostile/EurostileRound-Regular.woff2',
  '/fonts/eurostile/EurostileRound-Heavy.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      // Use individual addAll-with-catch so a single 404 (e.g. font path
      // typo) doesn't poison the whole install.
      .then(cache => Promise.all(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names
        .filter(n => n.startsWith('swu-') && n !== STATIC_CACHE && n !== DATA_CACHE && n !== IMAGE_CACHE)
        .map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin && !url.pathname.includes('/cards/')) return;

  // Card images â€” cache-first (immutable URLs, large payloads).
  if (url.pathname.startsWith('/cards/') || /\.(webp|jpg|png|svg)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return new Response('Image not found', { status: 404 });
      }
    })());
    return;
  }

  // JSON data â€” network-first, fall back to cache when offline.
  if (url.pathname.endsWith('.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return (await cache.match(request)) || new Response('Data not found', { status: 404 });
      }
    })());
    return;
  }

  // HTML navigation â€” network-first so users get fresh content; cache
  // fallback keeps the app readable when offline.
  const isNav = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    event.respondWith((async () => {
      try {
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, res.clone());
        }
        return res;
      } catch {
        return (await caches.match(request)) || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Other static assets (JS / CSS / fonts with hashed paths): cache-first.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const res = await fetch(request);
      if (res.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, res.clone());
      }
      return res;
    } catch {
      return new Response('Not found', { status: 404 });
    }
  })());
});
