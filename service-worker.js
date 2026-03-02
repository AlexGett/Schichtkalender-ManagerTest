const CACHE_NAME = 'schichtkalender-cache-test-v1.2.56'; // Version erhöht
const urlsToCache = [
    '/',
    '/index.html',
    '/manager.html',
    '/manager.js',
    '/manager_manifest.json',
    '/style.css',
    '/script.js',
    '/translations.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
    'https://cdn.jsdelivr.net/npm/toastify-js',
    '/ios/16.png',
    '/ios/32.png',
    '/ios/60.png',
    '/ios/76.png',
    '/ios/120.png',
    '/ios/152.png',
    '/ios/167.png',
    '/ios/180.png',
    '/ios/192.png',
    '/ios/512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// NEU: Logik für Web Share Target (POST Abfangen)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Prüfen, ob dies die Share-Aktion ist
    if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const file = formData.get('json_file');
                const jsonText = await file.text();
                
                // Wir öffnen die App und hängen den JSON-Inhalt als Parameter an 
                // oder nutzen postMessage, wenn die App bereits offen ist.
                // Einfachste Methode: Zurück zur Startseite und Daten via Message senden
                const client = await self.clients.openWindow('./?shared=true');
                
                // Warten, bis die Seite geladen ist, dann Daten senden
                setTimeout(() => {
                    if (client) {
                        client.postMessage({
                            type: 'SHARED_JSON_DATA',
                            payload: jsonText
                        });
                    }
                }, 2000); 

                return Response.redirect('./?shared=true', 303);
            })()
        );
        return;
    }

    // Standard Cache-First Strategie für alle anderen Anfragen
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200) return networkResponse;
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                return networkResponse;
            });
        }).catch(() => console.log('Offline-Fehler bei:', event.request.url))
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        const versionMatch = CACHE_NAME.match(/v(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : 'Unknown';
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ version });
        }
    }
});