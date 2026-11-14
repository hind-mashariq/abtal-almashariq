// أبطال المشارق — عامل الخدمة: يجعل التطبيق يفتح ويعمل بدون إنترنت
const CACHE = 'abtal-v2';
const CORE = ['./', './index.html', './manifest.json', './file_00000000e740821194dbc83a9a5c3936.png',
  './%D8%B4%D8%B9%D8%A7%D8%B1.jpeg', './icon-192.png', './icon-512.png', './apple-icon-180.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  // الخطوط: من الذاكرة أولًا
  if (FONTS.test(r.url)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // ملفات التطبيق: الشبكة أولًا (لتصل التحديثات)، والنسخة المحفوظة عند انقطاع الإنترنت أو بطئه
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./index.html'));
    const timer = setTimeout(() => fallback().then(m => { if (m && !done) { done = true; resolve(m); } }), 5000);
    fetch(r).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      clearTimeout(timer); if (!done) { done = true; resolve(res); }
    }).catch(() => { clearTimeout(timer); fallback().then(m => { if (!done) { done = true; resolve(m || Response.error()); } }); });
  }));
});
