const CACHE_NAME = 'flex-ops-tactical-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './FlexCapacityManager.js',
    './app.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null)
        ))
    );
    self.clients.claim();
});