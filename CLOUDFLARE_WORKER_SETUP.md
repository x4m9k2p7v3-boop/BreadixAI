# Cloudflare Worker Setup для BreadixAI

## Шаг 1: Создание Worker

1. Зайди на https://dash.cloudflare.com/
2. Перейди в **Workers & Pages**
3. Нажми **Create Worker**
4. Дай имя: `breadixai-api` (или любое другое)
5. Нажми **Deploy**

## Шаг 2: Загрузка кода

1. После создания нажми **Edit Code**
2. Удали весь код в редакторе
3. Скопируй содержимое файла `cloudflare-worker.js`
4. Вставь в редактор
5. Нажми **Save and Deploy**

## Шаг 3: Настройка переменных окружения

1. Вернись на страницу Worker
2. Перейди в **Settings** → **Variables**
3. Добавь следующие переменные:

### Environment Variables:

- **OMNIROUTE_BASE_URL**
  - Value: `https://твой-cloudflare-tunnel.trycloudflare.com` (без `/v1/chat/completions`)
  - Type: Text

- **OMNIROUTE_KEY**
  - Value: `sk-твой-api-ключ`
  - Type: Secret (зашифрованная)

- **TAVILY_KEY**
  - Value: `tvly-твой-ключ`
  - Type: Secret (зашифрованная)

4. Нажми **Save**

## Шаг 4: Получение URL Worker

После деплоя ты получишь URL вида:
```
https://breadixai-api.твой-аккаунт.workers.dev
```

Скопируй этот URL.

## Шаг 5: Обновление config.js

Открой `src/js/config.js` и измени `baseUrl`:

```javascript
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost'
        ? ''
        : 'https://breadixai-api.твой-аккаунт.workers.dev',
    chatUrl: '/api/chat',
    searchUrl: '/api/search',
    // ...
};
```

## Шаг 6: Деплой на GitHub

```bash
git add .
git commit -m "Switch to Cloudflare Workers"
git push origin main
```

## Проверка работы

1. Открой в браузере: `https://breadixai-api.твой-аккаунт.workers.dev/health`
2. Должен вернуться JSON:
```json
{
  "status": "ok",
  "timestamp": "2026-04-19T...",
  "omniroute": "configured",
  "tavily": "configured"
}
```

## Преимущества Cloudflare Workers

✅ **Бесплатно**: 100,000 запросов в день  
✅ **Быстро**: Edge network по всему миру  
✅ **Надёжно**: 99.99% uptime  
✅ **Безопасно**: API ключи зашифрованы  
✅ **Без холодного старта**: в отличие от Railway  

## Troubleshooting

### Ошибка "OMNIROUTE_KEY is not defined"
- Проверь что добавил переменные в Settings → Variables
- Переделай Worker после добавления переменных

### CORS ошибки
- Worker уже настроен на `Access-Control-Allow-Origin: *`
- Если проблема остаётся — проверь что используешь правильный URL

### 500 Internal Server Error
- Проверь логи Worker: Settings → Logs → Real-time Logs
- Проверь что Cloudflare tunnel запущен и доступен
