// FlixOn Service Worker
// Provides PWA installability + a safe offline fallback.
//
// IMPORTANT: this worker must NEVER cache anything that depends on who the
// user is or whether they have paid (pages, Next.js RSC/page-data requests,
// server actions, API calls). Doing so shows paying users a stale "please
// subscribe" screen. Only immutable, content-hashed static files are cached.

const CACHE_NAME = 'flixon-static-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/logo.png',
];

// Only these are safe to serve from cache: build-hashed assets and app icons.
function isImmutableStatic(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/icon-192x192.png' ||
    url.pathname === '/icon-512x512.png' ||
    url.pathname === '/logo.png' ||
    url.pathname === '/manifest.webmanifest'
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete EVERY old cache (this purges the stale v1 pages/RSC payloads
// already stored on existing users' devices) and take control immediately.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever handle plain GETs. Server actions / payments (POST) pass straight through.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore cross-origin (CDN video, images, Flutterwave, Supabase, etc.)
  if (url.origin !== self.location.origin) return;

  // Never touch API, auth, checkout, account or Next.js data/RSC requests.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/checkout') ||
    url.pathname.startsWith('/account') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/login') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') ||
    request.headers.get('Next-Router-State-Tree') ||
    request.headers.get('Next-Action')
  ) {
    return;
  }

  // Pages: always network. Only fall back to a static offline page if truly offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(
        async () => (await caches.match(OFFLINE_URL)) || new Response('You are offline', { status: 503 })
      )
    );
    return;
  }

  // Immutable static assets: cache-first (safe, URLs change when content changes).
  if (isImmutableStatic(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
  // Everything else: let the browser/network handle it normally.
});
