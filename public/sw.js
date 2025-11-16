// Service Worker for FF Tournaments PWA
const CACHE_NAME = 'ff-tournaments-v3';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache files individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
              })
          )
        );
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName).catch(err => {
              console.warn(`Failed to delete cache ${cacheName}:`, err);
            });
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error('Failed to parse push notification data:', error);
    // Fallback to text if JSON parsing fails
    if (event.data) {
      data = { body: event.data.text() || 'You have a new notification' };
    }
  }

  const title = data.title || 'FF Tournaments';
  const url = data.url || data.data?.url || '/';
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'notification',
    data: {
      url: url,
      tournamentId: data.data?.tournamentId || null,
      ...data.data
    },
    requireInteraction: false,
    actions: data.actions || [],
    vibrate: [200, 100, 200], // Vibration pattern for mobile devices
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get URL from notification data
  let urlToOpen = '/';
  if (typeof event.notification.data === 'string') {
    urlToOpen = event.notification.data;
  } else if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Try to find an existing window/tab with this origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          // Focus existing window and navigate to URL if different
          client.focus();
          if (client.url !== urlToOpen && 'navigate' in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }).catch((error) => {
      console.error('Error handling notification click:', error);
    })
  );
});

