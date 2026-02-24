# Расписание — инструкция по деплою

## Как обойти блокировку Cloudflare в России

Cloudflare заблокирован в РФ. Есть два пути:

### Вариант 1: GitHub Pages (рекомендуется для РФ)
GitHub Pages **не заблокирован** в России.

1. Создай репозиторий на GitHub
2. Положи `index.html` и `sw.js` в папку `docs/` (или в корень ветки `gh-pages`)
3. В настройках репозитория → Pages → Source: выбери `docs/` или `gh-pages`
4. Приложение будет доступно по адресу `https://username.github.io/repo-name/`

> ⚠️ Прокси к Яндексу (`/proxy/`) не нужен — приложение использует публичные CORS-прокси (AllOrigins и др.) напрямую из браузера.

### Вариант 2: Cloudflare + Service Worker (PWA-кеш)
Если Cloudflare Worker уже задеплоен:

1. Задеплой обновлённые `worker.js`, `index.html`, `sw.js`
2. Первый раз открой через VPN или на ПК — Service Worker закешируется
3. Последующие открытия (даже без VPN) будут работать из кеша

```bash
wrangler deploy
```

---

## Прокси внутри приложения

Приложение поддерживает несколько прокси для запросов к Яндекс Диску:

| Провайдер | Домен | Статус в РФ |
|-----------|-------|-------------|
| AllOrigins | api.allorigins.win | ✅ Работает |
| corsproxy.io | corsproxy.io | ✅ Работает |
| CodeTabs | api.codetabs.com | ✅ Работает |
| ThingProxy | thingproxy.freeboard.io | ✅ Работает |
| Cloudflare Worker | workers.dev | ❌ Заблокирован без VPN |

По умолчанию выбран **AllOrigins** — работает в России без VPN.
