# BreadixAI - Free AI Chat Platform

Бесплатная платформа для общения с различными AI моделями через единый интерфейс.

## 🚀 Возможности

- 🤖 Множество AI моделей (GPT, Claude, Llama, Qwen, DeepSeek и др.)
- 🔍 Веб-поиск через Tavily
- 📁 Поддержка файлов и изображений
- 💬 История чатов
- 🎨 Темная/светлая тема
- 🔒 Безопасное хранение API ключей на сервере

## 📦 Установка и запуск

### Локально

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env`:
```env
API_URL=http://localhost:20128/v1/chat/completions
API_KEY=your-omniroute-api-key
TAVILY_KEY=your-tavily-api-key
PORT=3000
```

3. Запустите сервер:
```bash
npm start
```

4. Откройте в браузере: `http://localhost:3000`

### Деплой на Render.com (Рекомендуется)

1. Создайте аккаунт на [Render.com](https://render.com)

2. Нажмите "New +" → "Web Service"

3. Подключите GitHub репозиторий

4. Настройки:
   - **Name**: breadixai
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Добавьте Environment Variables:
   - `API_URL` = `http://localhost:20128/v1/chat/completions`
   - `API_KEY` = ваш OmniRoute ключ
   - `TAVILY_KEY` = ваш Tavily ключ

6. Нажмите "Create Web Service"

7. После деплоя получите URL типа: `https://breadixai.onrender.com`

### Деплой на Railway.app

1. Создайте аккаунт на [Railway.app](https://railway.app)

2. "New Project" → "Deploy from GitHub repo"

3. Выберите репозиторий

4. Добавьте переменные окружения в Settings → Variables:
   - `API_URL`
   - `API_KEY`
   - `TAVILY_KEY`

5. Railway автоматически определит Node.js и запустит

### Деплой на Vercel

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Деплой:
```bash
vercel
```

3. Добавьте переменные окружения в Dashboard → Settings → Environment Variables

## 🔧 Настройка OmniRoute

Если у вас локальный OmniRoute на `localhost:20128`, для публичного доступа нужно:

**Вариант 1**: Использовать ngrok для туннеля:
```bash
ngrok http 20128
```
Затем в `.env` укажите ngrok URL

**Вариант 2**: Развернуть OmniRoute на облачном сервере

## 📝 Структура проекта

```
breadixwebsite/
├── server.js          # Backend прокси (скрывает API ключи)
├── index.html         # Главная страница
├── script.js          # Основная логика
├── config.js          # Конфигурация API
├── prompts.js         # Системные промпты для моделей
├── style.css          # Стили
├── auth.js/css        # Авторизация
├── sign_in.html       # Страница входа
├── sign_up.html       # Страница регистрации
├── package.json       # Зависимости
└── .env              # Переменные окружения (не коммитить!)
```

## 🔐 Безопасность

- API ключи хранятся только на сервере в `.env`
- Клиент не имеет доступа к ключам
- Все запросы идут через backend прокси
- `.env` добавлен в `.gitignore`

## 🛠️ Разработка

Для разработки с автоперезагрузкой:
```bash
npm run dev
```

## 📄 Лицензия

MIT

## 👤 Автор

Breadix

---

**Важно**: Не коммитьте `.env` файл в Git! Ваши API ключи должны оставаться приватными.
