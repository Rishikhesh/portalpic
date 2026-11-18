// Offline support. Keeps the app (HTML, scripts, styles, fonts) and every page you open, so PortalPic
// keeps working without internet. Photos never pass through here: they never leave the page.
const CACHE = "portalpic-v1";
const assetsIn = (text) => [...new Set(text.match(/\/assets\/[^"')\s]+/g) || [])];

self.addEventListener("install", (e) => e.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const html = await (await fetch("/", { cache: "no-cache" })).text();
  const assets = assetsIn(html);
  for (const css of assets.filter((a) => a.endsWith(".css"))) assets.push(...assetsIn(await (await fetch(css)).text())); // fonts
  await cache.addAll(["/", "/favicon.svg", "/manifest.webmanifest", ...new Set(assets)]);
  await self.skipWaiting();
})()));

self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/_vercel/")) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (e.request.mode === "navigate") { // pages: fresh when online, cached when offline
      try {
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      } catch {
        return (await cache.match(e.request)) || (await cache.match("/"));
      }
    }
    const hit = await cache.match(e.request); // hashed assets never change: cache first
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok) cache.put(e.request, res.clone());
    return res;
  })());
});
