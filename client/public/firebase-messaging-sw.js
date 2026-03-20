// Firebase Cloud Messaging Service Worker
// This file MUST be at the public root (served as /firebase-messaging-sw.js)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCG6MOlkw0EREki69YhwA2qm1I0EmrTQAI",
  authDomain: "ascension-957b6.firebaseapp.com",
  projectId: "ascension-957b6",
  storageBucket: "ascension-957b6.firebasestorage.app",
  messagingSenderId: "1077180336436",
  appId: "1:1077180336436:web:23631ba82fc1100b03bd61",
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Received background message:', payload);

  const { title, body, icon, data } = payload.notification || {};

  self.registration.showNotification(title || 'Ascension Protocol', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-72.png',
    data: data || {},
    vibrate: [200, 100, 200],
    tag: 'ascension-notification',
    renotify: true,
  });
});

// Handle notification click: focus/open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
