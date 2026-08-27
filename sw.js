const CACHE_NAME = "capturabox-shell-v4";
const APP_SHELL = [
  "./CAPTURABOX.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo se maneja la carcasa de la app (mismo origen, GET).
  // Las llamadas al backend (Google Apps Script) van siempre directo a la red.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Chequeo de versión (ver CAPTURABOX.html, _verificarVersionApp): va
  // siempre directo a la red, sin leer ni escribir caché — si no, un
  // dispositivo que quedó pegado en una versión vieja nunca se entera
  // de que hay una nueva, porque hasta este mismo chequeo le llegaría
  // cacheado.
  if (new URL(request.url).searchParams.has("__chk")) {
    event.respondWith(fetch(request));
    return;
  }

  // El documento HTML principal: red primero, para no quedar pegado a una
  // versión vieja mientras haya conexión. Si falla la red, se usa el caché
  // como respaldo offline.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // El resto de la carcasa (íconos, manifest): caché primero.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
