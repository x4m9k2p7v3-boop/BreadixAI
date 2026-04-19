# 🚀 Инструкция по деплою BreadixAI

## Шаг 1: Настройка Cloudflare Tunnel (для доступа к OmniRoute)

### Windows:

1. Скачайте Cloudflare Tunnel:
   https://github.com/cloudflare/cloudflared/releases/latest
   
2. Установите и запустите:
```bash
cloudflared tunnel --url http://localhost:20128
```

3. Скопируйте URL (например: `https://abc-def-123.trycloudflare.com`)

4. Обновите `.env`:
```env
API_URL=https://abc-def-123.trycloudflare.com/v1/chat/completions
```

### Автозапуск туннеля (опционально):

Создайте задачу в планировщике Windows:
- Программа: `cloudflared.exe`
- Аргументы: `tunnel --url http://localhost:20128`
- Триггер: При входе в систему

---

## Шаг 2: Тестирование локально

```bash
cd C:\Claude-code\project\breadixwebsite

# Запустите OmniRoute (если еще не запущен)

# Запустите Cloudflare Tunnel
cloudflared tunnel --url http://localhost:20128

# В новом терминале запустите backend
npm start
```

Откройте `http://localhost:3000` и протестируйте чат.

---

## Шаг 3: Деплой на Render.com

### 3.1 Подготовка репозитория

```bash
# Убедитесь что .env НЕ в Git
git status

# Если .env в списке - удалите его из Git
git rm --cached .env

# Коммит и пуш
git add .
git commit -m "Add backend proxy for BreadixAI"
git push origin main
```

### 3.2 Создание Web Service на Render

1. Зайдите на https://render.com
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Name**: `breadixai`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 3.3 Добавление переменных окружения

В разделе **Environment Variables** добавьте:

```
API_URL = https://abc-def-123.trycloudflare.com/v1/chat/completions
API_KEY = sk-e8b1e35d21c23e73-484be7-f506e652
TAVILY_KEY = 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
```

⚠️ **Важно**: Используйте URL из Cloudflare Tunnel!

### 3.4 Деплой

Нажмите **"Create Web Service"**

Render автоматически:
- Склонирует репозиторий
- Установит зависимости
- Запустит сервер

Получите URL: `https://breadixai.onrender.com`

---

## Шаг 4: Проверка работы

1. Откройте `https://breadixai.onrender.com`
2. Зарегистрируйтесь/войдите
3. Отправьте тестовое сообщение
4. Проверьте логи на Render (вкладка "Logs")

---

## Альтернатива: Railway.app

1. Зайдите на https://railway.app
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Выберите репозиторий
4. Добавьте переменные в **Settings → Variables**
5. Railway автоматически задеплоит

URL: `https://breadixai.up.railway.app`

---

## Альтернатива: Vercel

```bash
npm i -g vercel
vercel

# Добавьте переменные через Dashboard
```

---

## ⚠️ Важные моменты

### 1. Cloudflare Tunnel должен работать постоянно
- Запустите на ПК, который всегда включен
- Или используйте VPS для OmniRoute

### 2. Free план Render засыпает через 15 минут
- Первый запрос после сна займет ~30 сек
- Для постоянной работы нужен платный план ($7/мес)

### 3. Безопасность
- API ключи только на сервере
- `.env` в `.gitignore`
- Никогда не коммитьте `.env`

---

## 🔧 Troubleshooting

### Ошибка 401 Unauthorized
- Проверьте API_KEY в переменных окружения Render
- Проверьте что Cloudflare Tunnel работает

### Ошибка Connection refused
- Убедитесь что OmniRoute запущен
- Проверьте что Cloudflare Tunnel активен
- Проверьте URL в API_URL

### Медленная работа
- Free план Render засыпает - используйте платный
- Или используйте Railway (не засыпает)

---

## 📊 Мониторинг

### Проверка здоровья сервера:
```
https://breadixai.onrender.com/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2026-04-18T08:00:00.000Z",
  "omniroute": "configured",
  "tavily": "configured"
}
```

---

## 🎉 Готово!

Ваш сайт доступен по адресу: `https://breadixai.onrender.com`

Поделитесь ссылкой с пользователями!
