const CACHE = 'story-app-v1';
const API_CACHE = 'story-api-v1';
const STATIC = ['/', '/index.html'];
const BASE_URL = 'https://story-api.dicoding.dev/v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(STATIC.map((url) => c.add(url).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !allowedCaches.includes(key))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.origin === new URL(BASE_URL).origin) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (e.request.method === 'GET' && res.ok) {
            const resClone = res.clone();
            caches.open(API_CACHE).then((c) => c.put(e.request, resClone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;

        return fetch(e.request)
          .then((res) => {
            if (res.ok && e.request.method === 'GET') {
              const resClone = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, resClone));
            }
            return res;
          })
          .catch(() => caches.match('/index.html'));
      })
    );
  }
});

self.addEventListener('push', (e) => {
  const payload = e.data.json();

  const notification = {
    title: payload.title,
    options: { body: payload.body },
  };

  self.registration.showNotification(notification.title, notification);
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  if (e.action === 'close') return;

  const urlToOpen = e.notification.data?.url || '/#/home';
  const storyId = e.notification.data?.storyId;

  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (let client of list) {
          if ('focus' in client) {
            return client.focus().then(() => {
              return client.postMessage({
                action: 'navigate',
                url: storyId ? `/#/detail/${storyId}` : urlToOpen,
              });
            });
          }
        }
        return clients.openWindow(storyId ? `/#/detail/${storyId}` : urlToOpen);
      })
  );
});
