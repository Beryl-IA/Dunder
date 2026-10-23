/* =====================================================================
   Service worker — Suivi commercial
   ---------------------------------------------------------------------
   - Page (index.html) : réseau d'abord, repli sur le cache hors ligne.
     Chaque mise en ligne est donc récupérée dès qu'il y a du réseau,
     sans vider le cache à la main.
   - Icônes et manifest : cache d'abord, rafraîchi en arrière-plan.
   - Aucune requête vers un domaine tiers n'est interceptée ni émise.

   À chaque mise en ligne, change VERSION (même valeur que APP_VERSION
   dans index.html) : l'ancien cache est alors supprimé proprement.
   ===================================================================== */
const VERSION = 'v1.0.0';
const PREFIXE = 'suivi-commercial-';
const CACHE = PREFIXE + VERSION;
const PAGE = './';
const FICHIERS = [
  PAGE,
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];
// Au-delà de ce délai, on sert la version en cache (réseau faible sur chantier).
// La réponse réseau, si elle arrive ensuite, met quand même le cache à jour.
const DELAI_RESEAU_MS = 4000;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FICHIERS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(c => c.startsWith(PREFIXE) && c !== CACHE).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // jamais de tiers

  const chemin = url.pathname;
  const estPage = req.mode === 'navigate' || chemin.endsWith('/') || chemin.endsWith('/index.html');
  if (estPage) event.respondWith(reseauDabord(event, url));
  else event.respondWith(cacheDabord(event, req));
});

/** Copie une réponse redirigée (Safari refuse de servir une réponse « redirected » à une navigation). */
async function propre(rep) {
  if (!rep.redirected) return rep;
  const corps = await rep.blob();
  return new Response(corps, { status: rep.status, statusText: rep.statusText, headers: rep.headers });
}

async function reseauDabord(event, url) {
  const cache = await caches.open(CACHE);
  const appelReseau = fetch(url.origin + url.pathname.replace(/index\.html$/, ''), { cache: 'no-cache', credentials: 'same-origin' })
    .then(propre)
    .then(rep => {
      if (rep.ok) return cache.put(PAGE, rep.clone()).then(() => rep);
      return rep;
    });
  event.waitUntil(appelReseau.catch(() => {}));

  const delai = new Promise(resolve => setTimeout(() => resolve(null), DELAI_RESEAU_MS));
  try {
    const rep = await Promise.race([appelReseau, delai]);
    if (rep && rep.ok) return rep;
  } catch (e) { /* hors ligne */ }

  const enCache = await cache.match(PAGE);
  if (enCache) return enCache;
  // Ni réseau ni cache (premier lancement hors ligne) : on attend le réseau
  try { return await appelReseau; }
  catch (e) {
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hors ligne</title><p style="font-family:-apple-system,sans-serif;padding:24px">Hors ligne : ouvre l\'appli une première fois avec du réseau.</p>', {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function cacheDabord(event, req) {
  const cache = await caches.open(CACHE);
  const enCache = await cache.match(req, { ignoreSearch: true });
  const maj = fetch(req).then(async rep => {
    if (rep.ok && !rep.redirected) await cache.put(req, rep.clone());
    return rep;
  });
  if (enCache) {
    event.waitUntil(maj.catch(() => {}));
    return enCache;
  }
  try { return await maj; }
  catch (e) { return new Response('', { status: 504 }); }
}
