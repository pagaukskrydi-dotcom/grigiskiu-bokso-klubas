// Minimalus darbuotojas, kad programėlę būtų galima įdiegti telefone. Visada kreipiamasi į tinklą.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
