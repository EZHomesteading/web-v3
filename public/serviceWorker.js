// public/serviceWorker.js
import { precacheAndRoute } from "workbox-precaching";

// This is a placeholder that next-pwa will replace with the actual precache manifest
//self.__WB_MANIFEST

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // You can customize fetch handling here
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // IMPORTANT: Clone the request. A request is a stream and can only be consumed once.
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
        const responseToCache = response.clone();

        caches.open("v1").then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
