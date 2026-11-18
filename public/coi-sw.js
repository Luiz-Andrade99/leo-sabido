/*
 * Service worker de isolamento de origem (COOP/COEP).
 * O GitHub Pages não permite configurar esses cabeçalhos; sem eles o navegador não libera vários núcleos
 * para o WebAssembly, e a voz Faber fica cerca de 2× mais lenta. Este worker só acrescenta os cabeçalhos
 * às respostas do próprio site — não guarda nada e não fala com nenhum outro servidor.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Binários grandes da voz (lidos pelo worker com fetch): vão direto, sem passar por aqui.
  // Os scripts (.js/.mjs) continuam passando, porque as threads precisam dos cabeçalhos.
  if (/\/voz\/.*\.(onnx|data|wasm)$/.test(url.pathname)) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.status === 0) return res;
      const h = new Headers(res.headers);
      h.set('Cross-Origin-Opener-Policy', 'same-origin');
      h.set('Cross-Origin-Embedder-Policy', 'require-corp');
      h.set('Cross-Origin-Resource-Policy', 'same-origin');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
    }),
  );
});
