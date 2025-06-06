importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

if (workbox) {
  console.log("Workbox is loaded");

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  self.addEventListener("install", (event) => {
    console.log("Service worker installed");
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    console.log("Service worker activated");
    return self.clients.claim();
  });

  // Register route for network-first strategy
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
        }),
      ],
    })
  );

  // Cache images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );
} else {
  console.log("Workbox failed to load");
}

// PUSH NOTIFICATION HANDLING
self.addEventListener("push", function (event) {
  console.log("Push event received:", event);

  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push notification data:", data);

    const options = {
      body: data.body || "New message",
      icon: "/icon-192x192.png", // Make sure you have this icon file
      badge: "/badge-72x72.png", // Optional badge icon
      tag: data.id || "message", // Prevents duplicate notifications
      data: {
        conversationId: data.id,
        url: `/conversations/${data.id}`, // URL to navigate to when clicked
      },
      actions: [
        {
          action: "view",
          title: "View Message",
          icon: "/view-icon.png", // Optional action icon
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
      requireInteraction: false, // Set to true if you want notification to stay until user interacts
      silent: false, // Set to true for silent notifications
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "New Message", options)
    );
  } catch (error) {
    console.error("Error processing push notification:", error);

    // Fallback notification if parsing fails
    event.waitUntil(
      self.registration.showNotification("New Message", {
        body: "You have received a new message",
        icon: "/icon-192x192.png",
        tag: "fallback",
      })
    );
  }
});

// Handle notification click events
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    // User dismissed the notification
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // Check if there's already a window open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // If no window is open with the target URL, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close events (optional)
self.addEventListener("notificationclose", function (event) {
  console.log("Notification closed:", event);
  // You can track notification dismissals here if needed
});

// Handle push subscription changes (optional but recommended)
self.addEventListener("pushsubscriptionchange", function (event) {
  console.log("Push subscription changed:", event);

  event.waitUntil(
    // Re-subscribe and update the server
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(),
          // You'll need to pass your public VAPID key here
          // Or fetch it from your API
      })
      .then(function (newSubscription) {
        // Send new subscription to your server
        return fetch("/api/push-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSubscription),
        });
      })
  );
});

// Utility function for VAPID key conversion
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
