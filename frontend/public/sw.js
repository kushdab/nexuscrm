// NexusCRM Service Worker — offline-first, cache-then-network
const CACHE_NAME = 'nexuscrm-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/contacts',
  '/deals',
  '/pipeline',
  '/offline',
  '/manifest.json',
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: prune old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate for pages, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin, Stripe, and API requests
  if (!url.origin.includes(self.location.origin) || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline')))
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((res) => {
        caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
        return res;
      });
      return cached || fresh;
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'NexusCRM', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { url: data.url || '/' },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Background sync — queue API calls when offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-crm-data') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  const db = await openOfflineDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const items = await store.getAll();
  for (const item of items) {
    try {
      await fetch(item.url, { method: item.method, body: item.body, headers: item.headers });
      await store.delete(item.id);
    } catch (_) { /* retry next sync */ }
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nexuscrm-offline', 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}
