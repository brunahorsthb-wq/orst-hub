// ORST Hub — Service Worker v1.0
var CACHE = 'orst-hub-v1';
var ASSETS = [
  '/orst-hub/',
  '/orst-hub/index.html',
  '/orst-hub/vendas.html',
  '/orst-hub/manifest.json',
  '/orst-hub/icon-192.png',
  '/orst-hub/icon-512.png'
];

// Instala e cacheia os assets principais
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network first, cache fallback
self.addEventListener('fetch', function(e) {
  // Ignora requests externos (Firebase, CDN)
  if (!e.request.url.includes('github.io') && 
      !e.request.url.includes('localhost')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // Atualiza cache com versao mais recente
        var resClone = res.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(function() {
        // Offline: serve do cache
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/orst-hub/index.html');
        });
      })
  );
});
