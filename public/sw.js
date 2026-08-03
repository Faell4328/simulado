// Service worker mínimo pra funcionar offline depois da primeira visita.
// Estratégia: navegação = rede-primeiro com fallback pro index em cache;
// demais GET mesmo-origem = cache-primeiro com preenchimento em segundo plano.
// (Sem lista de assets fixa — o app tem hashes; cacheia conforme usa.)
const CACHE = 'simulado-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add('/')).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(CACHE).then((c) => c.put('/', res.clone())); return res })
        .catch(() => caches.match('/')),
    )
    return
  }

  e.respondWith(
    caches.match(req).then((cacheado) => {
      const rede = fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()))
        return res
      }).catch(() => cacheado)
      return cacheado || rede
    }),
  )
})
