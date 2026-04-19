# BreadixAI - Free AI Chat Platform

Бесплатная платформа для общения с различными AI моделями через единый интерфейс.

## 📚 Документация

- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** — полная структура проекта с описанием каждого файла
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — руководство для разработчиков
- **[DATABASE_V3.md](DATABASE_V3.md)** — документация базы данных v3
- **[UPGRADE_V3.md](UPGRADE_V3.md)** — инструкция по обновлению до v3
- **[FEATURES.md](FEATURES.md)** — список всех функций

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

## 📝 Структура проекта

```
breadixwebsite/
├── 🖥️ Backend
│   └── server.js                 # Express сервер, API прокси
│
├── 🎨 Frontend - Core
│   ├── index.html                # Главная страница
│   ├── script.js                 # Основная логика (~1400 строк)
│   ├── config.js                 # Конфигурация моделей
│   └── prompts.js                # Системные промпты
│
├── 💾 Frontend - Database
│   ├── stable-database.js        # Менеджер IndexedDB
│   ├── db-adapter.js             # Адаптер для чатов
│   ├── session-manager.js        # Управление сессиями
│   ├── sync-manager.js           # Синхронизация вкладок
│   ├── storage-monitor.js        # Мониторинг хранилища
│   └── crypto-utils.js           # Криптография (PBKDF2)
│
├── 🎨 Frontend - Features
│   ├── features.js               # Дополнительные функции
│   └── features-integration.js   # Интеграция features
│
├── 🔐 Frontend - Auth
│   ├── auth.js                   # Авторизация
│   ├── sign_in.html              # Страница входа
│   ├── sign_up.html              # Страница регистрации
│   └── password_recovery.html    # Восстановление пароля
│
├── 🎨 Frontend - UI
│   ├── style.css                 # Основные стили
│   ├── auth.css                  # Стили авторизации
│   ├── visual-fixes.css          # Исправления UI
│   ├── notifications.css         # Стили уведомлений
│   └── notifications.js          # Система уведомлений
│
├── 📚 Документация
│   ├── README.md                 # Этот файл
│   ├── PROJECT_STRUCTURE.md      # Структура проекта
│   ├── CONTRIBUTING.md           # Руководство для разработчиков
│   ├── DATABASE_V3.md            # Документация БД v3
│   ├── UPGRADE_V3.md             # Инструкция по обновлению
│   ├── FEATURES.md               # Список функций
│   └── VISUAL_FIXES.md           # Исправления UI
│
└── ⚙️ Конфигурация
    ├── package.json              # npm зависимости
    ├── .env.example              # Пример конфигурации
    ├── .gitignore                # Игнорируемые файлы
    ├── .editorconfig             # Стандарты форматирования
    └── railway.json              # Конфигурация Railway
```

Подробнее: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## 🔧 Настройка OmniRoute

Если у вас локальный OmniRoute на `localhost:20128`, для публичного доступа нужно:

**Вариант 1**: Использовать ngrok для туннеля:
```bash
ngrok http 20128
```
Затем в `.env` укажите ngrok URL

**Вариант 2**: Развернуть OmniRoute на облачном сервере

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
