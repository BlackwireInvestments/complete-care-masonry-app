/* Complete Care Masonry — service worker (app-shell offline) */
const C = 'ccm-v3';
const SHELL = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => Promise.all(
    SHELL.map(u => c.add(u).catch(() => {}))
  )));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // never cache writes
  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return; // let API/storage hit network (offline handled in app)
  if (url.hostname.includes('fonts.g')) {           // fonts: cache-first
    e.respondWith(caches.match(req).then(c => c || fetch(req).then(r => {
      const cc = r.clone(); caches.open(C).then(ca => ca.put(req, cc).catch(() => {})); return r;
    }).catch(() => c)));
    return;
  }
  // app shell: network-first, fall back to cache (works offline)
  e.respondWith(
    fetch(req).then(r => {
      const cc = r.clone(); caches.open(C).then(ca => ca.put(req, cc).catch(() => {}));
      return r;
    }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});
