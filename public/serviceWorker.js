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
