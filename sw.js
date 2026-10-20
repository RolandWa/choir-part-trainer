/* Service worker for Choir Part Trainer: network first, cache as fallback,
   so the app always updates when online and still opens offline at rehearsal. */
const CACHE = 'choir-cache-1.0.0';
const CORE = ['./', './index.html', './i18n.js', './warmups.js', './warmups.html', './manifest.webmanifest', './icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const lib = /(^|\.)cdnjs\.cloudflare\.com$|(^|\.)cdn\.jsdelivr\.net$/.test(url.hostname) && url.pathname.includes('abcjs');
  const sf = url.hostname === 'paulrosen.github.io' && url.pathname.includes('/midi-js-soundfonts/');
  if (!same && !lib && !sf) return;
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && (resp.ok || resp.type === 'opaque')) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
