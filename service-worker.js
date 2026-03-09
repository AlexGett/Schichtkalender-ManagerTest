const CACHE_NAME = 'schichtkalender-cache-test-v1.2.69';
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
    '/ios/512.png',
    // Hier können weitere spezifische Info-Dateien hinzugefügt werden,
    // wenn du möchtest, dass sie sofort gecacht werden.
    // Ansonsten werden sie bei der ersten Anfrage gecacht.
    // Beispiel: '/info_data/mein_info_bild.png',
    // '/info_data/wichtige_infos.pdf'
];

let pendingSharedFile = null;

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(urlsToCache);
        })
        .catch(error => {
            console.error('Fehler beim Caching der Dateien:', error);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        // Diese Anweisung sorgt dafür, dass der neue Service Worker sofort aktiv wird
        // und den alten ersetzt, ohne dass der Benutzer alle Tabs schließen muss.
        self.skipWaiting();
    }
    // NEU: Version an den Client senden
    if (event.data && event.data.type === 'GET_VERSION') {
        const versionMatch = CACHE_NAME.match(/v(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : 'Unknown';
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ version });
        }
    }
    // NEU: Client fragt nach pending file (für Cold Start)
    if (event.data && event.data.type === 'CHECK_FOR_FILE') {
        if (pendingSharedFile) {
            event.source.postMessage({ type: 'OPEN_FILE', content: pendingSharedFile });
            pendingSharedFile = null; // Datei konsumiert
        }
    }
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Share Target Logic: Abfangen von geteilten Dateien
    if (event.request.method === 'POST' && url.pathname.includes('share-target')) {
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const file = formData.get('file');

                if (file) {
                    const text = await file.text();
                    // Sende Daten an alle offenen Fenster
                    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
                    if (clients && clients.length > 0) {
                        for (const client of clients) {
                            client.postMessage({ type: 'OPEN_FILE', content: text });
                            if ('focus' in client) client.focus();
                        }
                    } else {
                        // Keine offenen Fenster (App war zu), Datei zwischenspeichern
                        pendingSharedFile = text;
                    }
                }
                return Response.redirect('./', 303);
            })()
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(
                networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                }
            ).catch(() => {
                console.log('Fetch fehlgeschlagen für:', event.request.url);
            });
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
