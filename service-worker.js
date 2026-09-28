const CACHE = 'aloha-wisdom-v4';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './styles/tokens.css', './styles/app.css',
  './src/main.js', './src/router.js', './src/quotes.js', './src/storage.js', './src/ui.js', './src/share.js', './src/backup.js',
  './data/quotes.json', './assets/icons/app-icon.svg', './assets/icons/app-icon-192.png', './assets/icons/app-icon-512.png', './assets/backgrounds/hawaii-korean-woman-v4.webp'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
