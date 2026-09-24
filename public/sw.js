const CACHE_NAME = "interview-platform-v2";
const STATIC_ASSETS = ["/", "/questions", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // API 请求不缓存，直连
  if (url.pathname.startsWith("/api/")) return;

  // network-first：优先回源拿最新，成功后写入缓存；离线/网络失败才回退缓存。
  // 避免 cache-first 下 CACHE_NAME 不变导致刷新永远命中旧版本（旧 UI/旧 JS）
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
