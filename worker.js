export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Разрешаем только запросы через /proxy/
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response('Not found', { status: 404 });
    }

    // Достаём целевой URL из пути
    const target = decodeURIComponent(url.pathname.replace('/proxy/', '')) + url.search;

    // Разрешаем только Яндекс домены — защита от злоупотреблений
    if (!target.startsWith('https://cloud-api.yandex.net') && !target.startsWith('https://downloader.disk.yandex.ru')) {
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

      return new Response(res.body, {
        status: res.status,
        headers,
      });
    } catch (e) {
      return new Response('Proxy error: ' + e.message, { status: 502 });
    }
  }
}
