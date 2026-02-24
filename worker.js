// Cloudflare Worker — раздаёт приложение И проксирует Яндекс API
//
// Маршруты:
//   GET /         → index.html
//   GET /sw.js    → Service Worker
//   GET /proxy/*  → прокси к Яндекс API

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ── Раздача файлов ──
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // Подтягиваем index.html из KV или из env (нужен Static Assets)
      // Для деплоя через wrangler pages или workers with assets:
      // этот worker будет работать вместе с __STATIC_CONTENT__
      if (env.__STATIC_CONTENT) {
        const asset = await env.__STATIC_CONTENT.get('index.html', { type: 'text' });
        if (asset) return new Response(asset, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
        });
      }
      return new Response('index.html not found — deploy with wrangler', { status: 404 });
    }

    if (url.pathname === '/sw.js') {
      if (env.__STATIC_CONTENT) {
        const sw = await env.__STATIC_CONTENT.get('sw.js', { type: 'text' });
        if (sw) return new Response(sw, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' }
        });
      }
      return new Response('sw.js not found', { status: 404 });
    }

    // ── Прокси к Яндекс API ──
    if (url.pathname.startsWith('/proxy/')) {
      const target = decodeURIComponent(url.pathname.replace('/proxy/', '')) + url.search;
      const allowed = ['https://cloud-api.yandex.net', 'https://downloader.disk.yandex.ru', 'https://disk.yandex.ru'];
      if (!allowed.some(d => target.startsWith(d))) {
        return new Response('Forbidden', { status: 403 });
      }
      try {
        const res = await fetch(target, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScheduleBot/1.0)', 'Accept': '*/*' },
          redirect: 'follow',
        });
        const headers = new Headers();
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        const ct = res.headers.get('Content-Type');
        if (ct) headers.set('Content-Type', ct);
        return new Response(res.body, { status: res.status, headers });
      } catch (e) {
        return new Response('Proxy error: ' + e.message, { status: 502 });
      }
    }

    return new Response('Not found', { status: 404 });
  }
}
