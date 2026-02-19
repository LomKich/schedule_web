export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Получаем целевой URL из параметра
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response('Missing url param', { status: 400 });
  }

  // Разрешаем только Яндекс домены
  const allowed = ['cloud-api.yandex.net', 'downloader.disk.yandex.ru', 
                   'disk.yandex.ru', 'yandex.net'];
  const targetUrl = new URL(decodeURIComponent(target));
  if (!allowed.some(d => targetUrl.hostname.endsWith(d))) {
    return new Response('Forbidden domain', { status: 403 });
  }

  const resp = await fetch(decodeURIComponent(target), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const headers = new Headers(resp.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.delete('content-security-policy');

  return new Response(resp.body, {
    status: resp.status,
    headers
  });
}
