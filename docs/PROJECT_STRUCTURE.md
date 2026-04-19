# 📁 Структура проекта BreadixAI

## 📋 Оглавление
- [Обзор](#обзор)
- [Backend](#backend)
- [Frontend - Core](#frontend---core)
- [Frontend - Database](#frontend---database)
- [Frontend - Features](#frontend---features)
- [Frontend - UI](#frontend---ui)
- [Документация](#документация)
- [Конфигурация](#конфигурация)
- [Зависимости между файлами](#зависимости-между-файлами)

---

## 🎯 Обзор

**Тип проекта:** Full-stack веб-приложение  
**Backend:** Node.js + Express  
**Frontend:** Vanilla JavaScript (ES6+)  
**База данных:** IndexedDB (браузерная)  
**Архитектура:** MVC-подобная с модульной структурой

**Всего файлов:** 31  
**Строк кода:** ~10,374

---

## 🖥️ Backend

### `server.js` (4.7 KB)
**Назначение:** Express сервер, прокси для API запросов  
**Зависимости:** express, cors, node-fetch, dotenv  
**Порты:** 3000 (по умолчанию)

**Функции:**
- Прокси для OmniRoute API (`/api/chat`)
- Прокси для Tavily Search API (`/api/search`)
- Статический файловый сервер
- Health check endpoint (`/health`)

**Зачем нужен:**
- Скрывает API ключи от клиента
- Обходит CORS ограничения
- Централизованная обработка ошибок

---

## 🎨 Frontend - Core

### `index.html` (26 KB)
**Назначение:** Главная страница приложения  
**Зависимости:** Все JS и CSS файлы

**Структура:**
```html
<div class="app">
  <aside class="sidebar">      <!-- История чатов -->
  <main class="main">           <!-- Область чата -->
    <div class="chat-container">
    <div class="input-area">    <!-- Поле ввода -->
  </main>
</div>
```

**Модальные окна:**
- Настройки пользователя
- Смена пароля
- Горячие клавиши
- Лимит токенов

---

### `script.js` (52 KB, ~1400 строк)
**Назначение:** Основная логика приложения  
**Зависимости:** config.js, prompts.js, stable-database.js, db-adapter.js

**Основные функции:**

#### Инициализация
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Проверка сессии
    // 2. Инициализация БД
    // 3. Миграция данных
    // 4. Загрузка чатов
    // 5. Настройка UI
});
```

#### Управление чатами
- `createNewChat()` — создание нового чата
- `loadChat(chatId)` — загрузка чата
- `saveChatHistory()` — сохранение в БД
- `updateChatHistory()` — обновление UI
- `renameChat(chatId)` — переименование
- `deleteChat(chatId)` — удаление

#### Отправка сообщений
- `sendMessage()` — отправка сообщения
- `addUserMessage()` — добавление сообщения пользователя
- `streamAIMessageFromAPI()` — стриминг ответа AI
- `callAIModel()` — вызов API

#### Работа с файлами
- `handleFileSelect()` — выбор файлов
- `handlePaste()` — вставка из буфера
- `readFile()` — чтение файла
- `updateAttachedFilesDisplay()` — отображение файлов

#### UI
- `toggleSidebar()` — переключение сайдбара
- `scrollToBottom()` — прокрутка вниз
- `showToast()` — уведомления
- `updateTokenCounter()` — счетчик токенов

---

### `config.js` (4 KB)
**Назначение:** Конфигурация API и моделей  
**Зависимости:** Нет

**Содержит:**
```javascript
const API_CONFIG = {
    chatUrl: '/api/chat',
    searchUrl: '/api/search'
};

const MODELS = {
    'kc/openai/gpt-4.1-nano': { ... },
    'kc/openai/gpt-5-nano': { ... },
    // ... 15 моделей
};
```

**Параметры моделей:**
- `name` — отображаемое имя
- `category` — категория (openai, llama, qwen, other)
- `description` — описание
- `maxTokens` — лимит токенов
- `hasVision` — поддержка изображений
- `hasThinking` — режим мышления

---

### `prompts.js` (35 KB)
**Назначение:** Системные промпты для моделей  
**Зависимости:** Нет

**Структура:**
```javascript
const SYSTEM_PROMPTS = {
    'kc/openai/gpt-4.1-nano': "Ты — умный AI ассистент...",
    'kc/openai/gpt-5-nano': "Ты — продвинутый AI...",
    // ... промпты для каждой модели
};
```

**Зачем нужны:**
- Настройка поведения каждой модели
- Единый стиль ответов
- Специализация по задачам

---

## 💾 Frontend - Database

### `stable-database.js` (24 KB, ~730 строк)
**Назначение:** Менеджер IndexedDB  
**Зависимости:** Нет (нативный IndexedDB API)

**Класс:** `StableDatabaseManager`

**Таблицы (Object Stores):**
1. `users` — пользователи
2. `chats` — чаты
3. `messages` — сообщения
4. `settings` — настройки пользователей
5. `avatars` — аватары
6. `activity` — история активности
7. `favorites` — избранные сообщения
8. `statistics` — статистика использования
9. `backups` — резервные копии
10. `sessions` — сессии (v3)
11. `app_settings` — настройки приложения (v3)

**Основные методы:**

#### Инициализация
- `init()` — инициализация БД
- `openDatabase()` — открытие/создание БД
- `verifyDataIntegrity()` — проверка целостности

#### CRUD операции
- `write(store, data)` — запись
- `read(store, key)` — чтение
- `readAll(store)` — чтение всех
- `delete(store, key)` — удаление
- `safeWrite()` — запись с повторами

#### Специализированные методы
- `saveUser()`, `getUser()` — пользователи
- `saveChat()`, `getChatsByUser()` — чаты
- `saveMessage()`, `getMessagesByChat()` — сообщения
- `saveAppSetting()`, `getAppSetting()` — настройки
- `createBackup()`, `restoreFromBackup()` — бэкапы

#### Автосохранение
- `startAutoSave()` — запуск автосохранения (30 сек)
- `flushPendingWrites()` — сброс очереди записи
- `cleanup()` — очистка при выходе

---

### `db-adapter.js` (4.2 KB)
**Назначение:** Адаптер для работы с чатами  
**Зависимости:** stable-database.js

**Класс:** `DatabaseAdapter`

**Зачем нужен:**
- Упрощает работу с чатами в script.js
- Абстракция над stableDB
- Прозрачная миграция localStorage → IndexedDB

**Методы:**
- `saveChats(chats)` — сохранить все чаты
- `loadChats()` — загрузить чаты пользователя
- `deleteChat(chatId)` — удалить чат
- `saveCurrentChatId()` — сохранить текущий ID
- `loadCurrentChatId()` — загрузить текущий ID

---

### `session-manager.js` (9.6 KB)
**Назначение:** Управление сессиями пользователей  
**Зависимости:** stable-database.js

**Класс:** `SessionManager`

**Функции:**
- Генерация UUID токенов
- Создание/восстановление сессий
- Автопродление при активности
- Таймаут 30 дней
- Множественные сессии

**Методы:**
- `createSession(username)` — создать сессию
- `restoreSession()` — восстановить сессию
- `updateActivity()` — обновить активность
- `extendSession()` — продлить сессию
- `destroySession()` — уничтожить сессию
- `isAuthenticated()` — проверка авторизации
- `getCurrentUser()` — получить текущего пользователя

**Автоматика:**
- Обновление активности каждые 5 минут
- Throttled обновление при действиях пользователя
- Очистка истекших сессий раз в час

---

### `sync-manager.js` (9.9 KB)
**Назначение:** Синхронизация между вкладками  
**Зависимости:** Нет (BroadcastChannel API)

**Класс:** `SyncManager`

**Как работает:**
- BroadcastChannel для real-time обмена
- Уникальный ID для каждой вкладки
- Игнорирование собственных сообщений

**События:**
- `tab_opened` / `tab_closed`
- `chat_created` / `chat_updated` / `chat_deleted`
- `message_sent`
- `user_logged_in` / `user_logged_out`
- `settings_changed` / `model_changed`

**Методы:**
- `broadcast(type, data)` — отправить сообщение
- `on(type, handler)` — подписаться на событие
- `off(type, handler)` — отписаться
- `notifyChatCreated()` — уведомить о создании чата
- `notifyChatDeleted()` — уведомить об удалении

---

### `storage-monitor.js` (15 KB)
**Назначение:** Мониторинг хранилища IndexedDB  
**Зависимости:** stable-database.js

**Класс:** `StorageMonitor`

**Функции:**
- Проверка квоты хранилища
- Предупреждения при заполнении
- Автоматическая очистка
- Статистика использования

**Методы:**
- `getStorageInfo()` — информация о квоте
- `checkStorage()` — проверка состояния
- `startMonitoring()` — запуск мониторинга (каждые 5 мин)
- `autoCleanup()` — автоочистка
- `cleanOldChats(days)` — удалить старые чаты
- `cleanActivityHistory(keep)` — очистить историю
- `cleanOldBackups(keep)` — удалить старые бэкапы

**Пороги:**
- 80% — предупреждение
- 95% — критический уровень + автоочистка

---

### `crypto-utils.js` (8.9 KB)
**Назначение:** Криптографические функции  
**Зависимости:** Нет (Web Crypto API)

**Класс:** `CryptoUtils`

**Функции:**
- Хеширование паролей (PBKDF2-SHA256)
- Генерация соли
- Проверка паролей
- Миграция старых паролей

**Методы:**
- `hashPassword(password, salt)` — хешировать пароль
- `verifyPassword(password, hash, salt)` — проверить пароль
- `verifyLegacyPassword()` — проверить старый формат
- `migratePassword()` — мигрировать на новый формат
- `generateToken(length)` — генерация токена
- `hashString(str)` — хешировать строку
- `checkPasswordStrength()` — проверка надежности

**Параметры:**
- Итерации PBKDF2: 100,000
- Длина соли: 16 байт
- Длина хеша: 32 байта (SHA-256)

---

## 🎨 Frontend - Features

### `features.js` (10.6 KB)
**Назначение:** Дополнительные функции  
**Зависимости:** stable-database.js

**Классы:**

#### `SimpleCaptcha`
- Математическая капча
- Генерация примеров (+, -, *)
- Проверка ответа

#### `PasswordRecovery`
- Сохранение контрольного вопроса
- Проверка ответа
- Сброс пароля

#### `ActivityHistory`
- Логирование действий
- Получение истории
- Очистка истории

#### `AvatarManager`
- Загрузка аватара
- Удаление аватара
- Валидация размера (макс 2MB)

#### `VoiceInput`
- Распознавание речи (Web Speech API)
- Поддержка русского языка
- Визуальная индикация

#### `FavoritesManager`
- Добавление в избранное
- Удаление из избранного
- Получение списка

#### `StatisticsManager`
- Подсчет токенов
- Статистика по моделям
- Ежедневная статистика

**Утилиты:**
- `sanitizeHTML()` — защита от XSS
- `sanitizeInput()` — очистка ввода

---

### `features-integration.js` (20.6 KB)
**Назначение:** Интеграция features с основным приложением  
**Зависимости:** features.js, script.js, stable-database.js

**Функции:**
- Инициализация всех features
- Привязка к UI элементам
- Обработчики событий
- Горячие клавиши

**Горячие клавиши:**
- `Ctrl + N` — новый чат
- `Ctrl + ,` — настройки
- `Ctrl + E` — экспорт чатов
- `Ctrl + /` — справка по клавишам

**Интеграции:**
- Меню пользователя
- Настройки
- Экспорт/импорт
- Статистика
- Избранное
- Голосовой ввод

---

## 🔐 Frontend - Auth

### `auth.js` (12.7 KB)
**Назначение:** Авторизация и регистрация  
**Зависимости:** stable-database.js, crypto-utils.js, session-manager.js, features.js

**Функции:**

#### Валидация
- `validateUsername()` — проверка логина
- `validatePassword()` — проверка пароля
- `getPasswordStrength()` — надежность пароля

#### Хеширование
- `hashPassword()` — старый формат (fallback)
- Использует `cryptoUtils` для нового формата

#### Rate Limiting
- `checkRateLimit()` — проверка лимита попыток
- `recordLoginAttempt()` — запись попытки
- Максимум 5 попыток за 15 минут

#### Формы
- Обработка входа (sign_in.html)
- Обработка регистрации (sign_up.html)
- Переключение видимости пароля
- Индикатор надежности пароля

---

### `sign_in.html` (4.4 KB)
**Назначение:** Страница входа  
**Зависимости:** auth.css, notifications.js, auth.js

**Элементы:**
- Форма входа (логин + пароль)
- Чекбокс "Запомнить меня"
- Ссылка на восстановление пароля
- Ссылка на регистрацию
- Ссылка на условия использования

---

### `sign_up.html` (8.6 KB)
**Назначение:** Страница регистрации  
**Зависимости:** auth.css, notifications.js, auth.js

**Элементы:**
- Форма регистрации
- Логин + пароль + подтверждение
- Контрольный вопрос для восстановления
- Индикатор надежности пароля
- Чекбокс согласия с условиями

---

### `password_recovery.html` (12.2 KB)
**Назначение:** Восстановление пароля  
**Зависимости:** auth.css, notifications.js, features.js

**Этапы:**
1. Ввод логина
2. Ответ на контрольный вопрос
3. Установка нового пароля

---

## 🎨 Frontend - UI

### `style.css` (35.4 KB, ~1000 строк)
**Назначение:** Основные стили приложения  
**Зависимости:** Нет

**Структура:**
```css
/* === VARIABLES === */
:root { ... }

/* === RESET === */
* { ... }

/* === LAYOUT === */
.app, .sidebar, .main { ... }

/* === COMPONENTS === */
.message, .chat-item, .button { ... }

/* === THEMES === */
[data-theme="dark"] { ... }

/* === RESPONSIVE === */
@media (max-width: 768px) { ... }
```

**Темы:**
- Светлая (по умолчанию)
- Темная

**Адаптивность:**
- Desktop: > 768px
- Mobile: < 768px

---

### `auth.css` (6.8 KB)
**Назначение:** Стили страниц авторизации  
**Зависимости:** Нет

**Элементы:**
- Форма входа/регистрации
- Индикатор надежности пароля
- Кнопки переключения видимости
- Ссылки

---

### `visual-fixes.css` (11.2 KB)
**Назначение:** Исправления UI багов  
**Зависимости:** style.css (переопределяет)

**Исправления:**
- Выравнивание иконок
- Обрезка текста с ellipsis
- Фиксированные размеры кнопок
- Адаптивность селекторов

---

### `notifications.css` (3.9 KB)
**Назначение:** Стили уведомлений  
**Зависимости:** Нет

**Компоненты:**
- Toast уведомления
- Alert модальные окна
- Confirm диалоги
- Prompt диалоги

---

### `notifications.js` (7.2 KB)
**Назначение:** Система уведомлений  
**Зависимости:** Нет

**Класс:** `NotificationSystem`

**Методы:**
- `toast(message, type, duration)` — всплывающее уведомление
- `alert(message, type)` — модальное окно
- `confirm(message, title)` — диалог подтверждения
- `prompt(message, defaultValue, title)` — диалог ввода

**Типы:**
- `success` — успех (зеленый)
- `error` — ошибка (красный)
- `warning` — предупреждение (желтый)
- `info` — информация (синий)

---

## 📚 Документация

### `README.md` (4.4 KB)
**Назначение:** Основная документация проекта  
**Содержит:**
- Описание проекта
- Возможности
- Установка и запуск
- Деплой (Render, Railway, Vercel)
- Структура проекта
- Безопасность

---

### `DATABASE_README.md` (7.9 KB)
**Назначение:** Документация базы данных v2  
**Содержит:**
- Что сохраняется
- Автосохранение
- Преимущества IndexedDB
- Стабильность
- Архитектура
- Гарантии

---

### `DATABASE_V3.md` (15 KB)
**Назначение:** Документация базы данных v3  
**Содержит:**
- Новые возможности v3
- Структура БД
- Миграция данных
- Безопасность
- Синхронизация
- Мониторинг
- API для разработчиков

---

### `UPGRADE_V3.md` (12 KB)
**Назначение:** Инструкция по обновлению до v3  
**Содержит:**
- Что было сделано
- Как запустить
- Что произойдет при первом запуске
- Проверка работы
- Возможные проблемы

---

### `FEATURES.md` (7.9 KB)
**Назначение:** Описание всех функций  
**Содержит:**
- 14 основных функций
- Безопасность
- Управление данными
- UX/UI улучшения
- Статистика
- Технические детали

---

### `VISUAL_FIXES.md` (4.4 KB)
**Назначение:** Список исправлений UI  
**Содержит:**
- 12 исправленных проблем
- Технические детали
- Использованные техники

---

## ⚙️ Конфигурация

### `package.json` (544 B)
**Назначение:** Конфигурация npm проекта  
**Зависимости:**
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "node-fetch": "^2.7.0",
  "dotenv": "^16.3.1"
}
```

**Скрипты:**
- `npm start` — запуск сервера
- `npm run dev` — запуск с nodemon

---

### `.env.example` (437 B)
**Назначение:** Пример конфигурации окружения  
**Переменные:**
- `API_URL` — URL OmniRoute API
- `API_KEY` — ключ OmniRoute
- `TAVILY_KEY` — ключ Tavily Search
- `PORT` — порт сервера (по умолчанию 3000)

---

### `.gitignore` (117 B)
**Назначение:** Игнорируемые файлы для Git  
**Содержит:**
```
node_modules/
.env
.DS_Store
```

---

### `railway.json` (263 B)
**Назначение:** Конфигурация для Railway.app  
**Содержит:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 📄 Статические страницы

### `privacy.html` (8 KB)
**Назначение:** Политика конфиденциальности  
**Содержит:** Юридический текст о сборе и использовании данных

---

### `terms.html` (6.4 KB)
**Назначение:** Условия использования  
**Содержит:** Юридический текст о правилах использования сервиса

---

## 🔗 Зависимости между файлами

### Порядок загрузки в `index.html`:
```html
1. marked.min.js          <!-- Markdown парсер -->
2. config.js              <!-- Конфигурация -->
3. prompts.js             <!-- Системные промпты -->
4. crypto-utils.js        <!-- Криптография -->
5. stable-database.js     <!-- База данных -->
6. session-manager.js     <!-- Сессии -->
7. sync-manager.js        <!-- Синхронизация -->
8. storage-monitor.js     <!-- Мониторинг -->
9. db-adapter.js          <!-- Адаптер БД -->
10. features.js           <!-- Дополнительные функции -->
11. script.js             <!-- Основная логика -->
12. features-integration.js <!-- Интеграция features -->
```

### Граф зависимостей:
```
server.js (независимый)
    ↓
index.html
    ↓
config.js (независимый)
prompts.js (независимый)
crypto-utils.js (независимый)
    ↓
stable-database.js
    ↓
session-manager.js → stable-database.js
sync-manager.js (независимый)
storage-monitor.js → stable-database.js
    ↓
db-adapter.js → stable-database.js
features.js → stable-database.js
    ↓
script.js → config.js, prompts.js, stable-database.js, db-adapter.js
    ↓
features-integration.js → features.js, script.js
```

---

## 🎯 Точки входа

### Для пользователя:
1. `sign_in.html` — вход в систему
2. `sign_up.html` — регистрация
3. `index.html` — главное приложение (после входа)

### Для разработчика:
1. `server.js` — запуск backend
2. `script.js` — основная логика frontend
3. `stable-database.js` — работа с данными

---

## 📊 Статистика

| Категория | Файлов | Строк кода |
|-----------|--------|------------|
| Backend | 1 | ~140 |
| Frontend Core | 4 | ~1,500 |
| Database | 5 | ~1,200 |
| Features | 2 | ~700 |
| Auth | 4 | ~500 |
| UI (CSS) | 4 | ~1,500 |
| UI (HTML) | 5 | ~600 |
| Документация | 6 | N/A |
| Конфигурация | 4 | N/A |
| **Итого** | **35** | **~10,374** |

---

## 🚀 Как начать работу

### Для нового разработчика:

1. **Изучите документацию:**
   - `README.md` — общий обзор
   - `PROJECT_STRUCTURE.md` — этот файл
   - `DATABASE_V3.md` — работа с данными

2. **Запустите проект:**
   ```bash
   npm install
   npm start
   ```

3. **Откройте в браузере:**
   - http://localhost:3000

4. **Изучите код в порядке:**
   - `config.js` — конфигурация
   - `stable-database.js` — база данных
   - `script.js` — основная логика
   - `features.js` — дополнительные функции

5. **Используйте DevTools:**
   - F12 → Console — логи
   - F12 → Application → IndexedDB — база данных
   - F12 → Network — API запросы

---

## 📝 Соглашения о коде

### Именование:
- **Файлы:** kebab-case (`session-manager.js`)
- **Классы:** PascalCase (`SessionManager`)
- **Функции:** camelCase (`createSession()`)
- **Константы:** UPPER_SNAKE_CASE (`API_CONFIG`)

### Комментарии:
- Секции: `// === SECTION NAME ===`
- Функции: JSDoc формат
- Сложная логика: inline комментарии

### Структура файла:
```javascript
// === IMPORTS ===
// (если есть)

// === CONSTANTS ===
const CONSTANT = value;

// === CLASS/FUNCTIONS ===
class MyClass { ... }

// === INITIALIZATION ===
const instance = new MyClass();

// === EXPORTS ===
window.myInstance = instance;
```

---

**Автор:** Breadix  
**Дата:** 19 апреля 2026  
**Версия:** 3.0.0
