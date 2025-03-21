// public/serviceWorker.js
self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Simple pass-through fetch handler
  event.respondWith(fetch(event.request));
});
