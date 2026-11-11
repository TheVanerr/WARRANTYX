/* WarrantyX uygulama katmanı (PWA): kurulan uygulamanın açılışı ve çevrimdışı çalışma. Yalnız yayında kaydedilir.
   - Sayfa her açılışta ve yenilemede önce sunucuya sorulur: yeni sürüm yayındaysa o açılır. İnternet yoksa ya da
     sunucu birkaç saniyede yanıt vermezse son saklanan sürüm açılır.
   - Script ve stillerin adresinde içerik özeti vardır (?v=), içerik değişmez; önce buradan verilir.
   - GitHub API'sine giden istekler (belgeler) ve surum.json buraya hiç uğramaz.
   SURUM ve DOSYALAR satırlarını tools/yayin-hazirla.js yayında doldurur. */

const SURUM = 'yerel';
const DOSYALAR = ['./'];

const ON_EK = 'warrantyx-';
const CACHE = `${ON_EK}${SURUM}`;
const KOK = new URL('./', self.location).href;
const SAYFA_BEKLE_MS = 4000;

const surumluMu = (url) => new URL(url, self.location).searchParams.has('v');

/** Önceki sürümün sakladığı aynı adresli dosya yeniden indirilmez: adres aynıysa içerik de aynıdır */
async function eskiden(url) {
  for (const key of await caches.keys()) {
    if (!key.startsWith(ON_EK) || key === CACHE) continue;
    const hit = await (await caches.open(key)).match(url);
    if (hit) return hit;
  }
  return null;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(DOSYALAR.map(async (url) => {
      const eski = surumluMu(url) ? await eskiden(url) : null;
      if (eski) return cache.put(url, eski);
      const res = await fetch(url, { cache: surumluMu(url) ? 'default' : 'no-cache' });
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      return cache.put(url, res);
    }));
    // Yeni sürüm beklemeden devreye girer; açık sayfa zaten sunucudan geldiği için etkilenmez
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(ON_EK) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

/** Sayfa: önce sunucu, yoksa saklanan. Yavaş ağda saklanan açılır, yenisi arka planda saklanır. */
async function sayfa(request) {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  const asilSayfa = !url.search && (url.href.split('#')[0] === KOK || url.href.split('#')[0] === `${KOK}index.html`);
  const ag = fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(async (res) => {
    if (res.redirected) return Response.redirect(res.url, 302);
    if (res.ok && asilSayfa) await cache.put(KOK, res.clone());
    return res;
  });
  const saklanan = await cache.match(KOK);
  if (!saklanan) return ag.catch(() => Response.error());
  return Promise.race([
    ag.catch(() => saklanan),
    new Promise((resolve) => setTimeout(() => resolve(saklanan), SAYFA_BEKLE_MS))
  ]);
}

/** Dosya: saklanan varsa o, yoksa sunucudan; sürümlüyse saklanır */
async function dosya(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic' && surumluMu(request.url)) await cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Belgeler GitHub API'sinden gelir: hiç karışılmaz
  if (url.origin !== self.location.origin || !url.href.startsWith(KOK)) return;
  if (url.pathname.endsWith('/surum.json')) return;
  event.respondWith(request.mode === 'navigate' ? sayfa(request) : dosya(request));
});
