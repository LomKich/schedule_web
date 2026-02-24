// Cloudflare Worker — ТОЛЬКО прокси к Яндекс API
// Статические файлы (index.html, sw.js) раздаёт wrangler через "assets" в wrangler.jsonc автоматически

export default {
  async fetch(request) {
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

    // Только запросы через /proxy/ обрабатываем — остальное отдаёт wrangler assets
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response('Not found', { status: 404 });
    }

    const target = decodeURIComponent(url.pathname.replace('/proxy/', '')) + url.search;

    // Белый список — защита от злоупотреблений
    const allowed = [
      'https://cloud-api.yandex.net',
      'https://downloader.disk.yandex.ru',
    ];
    if (!allowed.some(d => target.startsWith(d))) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const res = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScheduleBot/1.0)',
          'Accept': '*/*',
        },
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
}
