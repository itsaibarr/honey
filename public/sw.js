// Pigeon Post service worker — offline re-read of received letters.
// Strategy: static assets cache-first; pages network-first with a cache
// fallback so the last-loaded mailbox is re-readable with no signal.
const VERSION = "v1";
const CACHE = `pigeon-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never cache mutations / server actions
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    /\.(?:png|svg|ico|webmanifest|woff2?|jpg|jpeg)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  const wantsHtml =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (wantsHtml) {
    event.respondWith(networkFirst(req));
  }
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(
      "<!doctype html><meta charset='utf-8'><title>Нет связи</title>" +
        "<body style='margin:0;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Georgia,serif;color:#f7eeda;background:radial-gradient(120% 120% at 50% 0%,#d98a55,#3a221d)'>" +
        "<div><div style='font-size:48px'>🕊️</div><p>Нет связи. Открой снова, когда появится сигнал.</p></div></body>",
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 200 },
    );
  }
}
