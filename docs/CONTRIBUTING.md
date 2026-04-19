# 🤝 Руководство для разработчиков BreadixAI

## 📋 Содержание
- [Начало работы](#начало-работы)
- [Стандарты кода](#стандарты-кода)
- [Архитектура](#архитектура)
- [Процесс разработки](#процесс-разработки)
- [Тестирование](#тестирование)
- [Деплой](#деплой)
- [Частые вопросы](#частые-вопросы)

---

## 🚀 Начало работы

### Требования

- **Node.js:** >= 14.0.0
- **npm:** >= 6.0.0
- **Браузер:** Chrome/Firefox/Edge (последние версии)
- **Git:** для контроля версий

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yourusername/breadixai.git
cd breadixai

# 2. Установить зависимости
npm install

# 3. Создать .env файл
cp .env.example .env

# 4. Заполнить .env своими ключами
# API_URL=http://localhost:20128/v1/chat/completions
# API_KEY=your-omniroute-key
# TAVILY_KEY=your-tavily-key
# PORT=3000

# 5. Запустить сервер
npm start

# 6. Открыть в браузере
# http://localhost:3000
```

### Структура проекта

Изучите `PROJECT_STRUCTURE.md` для понимания архитектуры.

**Ключевые файлы для начала:**
1. `config.js` — конфигурация моделей
2. `stable-database.js` — работа с данными
3. `script.js` — основная логика
4. `server.js` — backend

---

## 📝 Стандарты кода

### Именование

#### Файлы
```
kebab-case.js          ✅ Правильно
camelCase.js           ❌ Неправильно
PascalCase.js          ❌ Неправильно
```

#### Переменные и функции
```javascript
// camelCase для переменных и функций
const userName = 'John';
function getUserData() { }

// PascalCase для классов
class SessionManager { }

// UPPER_SNAKE_CASE для констант
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
```

#### CSS классы
```css
/* kebab-case */
.chat-container { }
.message-content { }
.user-avatar { }
```

### Форматирование

#### JavaScript

```javascript
// === ХОРОШО ===

// 1. Отступы: 4 пробела
function example() {
    if (condition) {
        doSomething();
    }
}

// 2. Точка с запятой обязательна
const value = 10;
const result = calculate();

// 3. Пробелы вокруг операторов
const sum = a + b;
if (x === y) { }

// 4. Одинарные кавычки для строк
const message = 'Hello';
const html = '<div>Content</div>';

// 5. Деструктуризация где возможно
const { username, email } = user;
const [first, second] = array;

// 6. Arrow functions для коротких функций
const double = x => x * 2;
const sum = (a, b) => a + b;

// 7. Async/await вместо промисов
async function loadData() {
    const data = await fetchData();
    return data;
}


// === ПЛОХО ===

// 1. Табы вместо пробелов
function example(){
	if(condition){
		doSomething()
	}
}

// 2. Нет точки с запятой
const value = 10
const result = calculate()

// 3. Нет пробелов
const sum=a+b;
if(x===y){}

// 4. Двойные кавычки
const message = "Hello";

// 5. Нет деструктуризации
const username = user.username;
const email = user.email;

// 6. Function вместо arrow
const double = function(x) { return x * 2; };

// 7. Промисы вместо async/await
function loadData() {
    return fetchData().then(data => {
        return data;
    });
}
```

#### CSS

```css
/* === ХОРОШО === */

/* 1. Отступы: 4 пробела */
.container {
    display: flex;
    padding: 16px;
}

/* 2. Свойства в алфавитном порядке */
.button {
    background: blue;
    border: none;
    color: white;
    padding: 8px 16px;
}

/* 3. Группировка связанных правил */
.message {
    /* Layout */
    display: flex;
    flex-direction: column;
    
    /* Spacing */
    margin: 8px 0;
    padding: 12px;
    
    /* Visual */
    background: var(--bg-secondary);
    border-radius: 8px;
}


/* === ПЛОХО === */

/* 1. Табы и непоследовательные отступы */
.container{
	display:flex;
  padding:16px;
}

/* 2. Хаотичный порядок свойств */
.button {
    padding: 8px 16px;
    background: blue;
    color: white;
    border: none;
}

/* 3. Нет группировки */
.message {
    display: flex;
    background: var(--bg-secondary);
    margin: 8px 0;
    flex-direction: column;
    border-radius: 8px;
    padding: 12px;
}
```

### Комментарии

#### Секционные комментарии

```javascript
// === IMPORTS ===
import { something } from 'somewhere';

// === CONSTANTS ===
const API_URL = 'https://api.example.com';

// === HELPER FUNCTIONS ===
function helper() { }

// === MAIN CLASS ===
class MyClass { }

// === INITIALIZATION ===
const instance = new MyClass();

// === EXPORTS ===
export default instance;
```

#### JSDoc комментарии

```javascript
/**
 * Создает новую сессию для пользователя
 * 
 * @param {string} username - Имя пользователя
 * @returns {Promise<Object>} Объект сессии с sessionId, createdAt, expiresAt
 * @throws {Error} Если пользователь не найден
 * 
 * @example
 * const session = await createSession('john_doe');
 * console.log(session.sessionId); // "uuid-v4-string"
 */
async function createSession(username) {
    // Implementation
}

/**
 * Менеджер сессий пользователей
 * 
 * @class SessionManager
 * @description Управляет созданием, восстановлением и уничтожением сессий.
 * Использует IndexedDB для хранения и автоматически продлевает сессии при активности.
 */
class SessionManager {
    /**
     * Создает экземпляр SessionManager
     */
    constructor() {
        this.currentSession = null;
        this.SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 дней
    }
}
```

#### Inline комментарии

```javascript
// Хорошо: объясняет ПОЧЕМУ, а не ЧТО
// Используем throttle чтобы не перегружать БД при частых действиях
const throttledUpdate = throttle(updateActivity, 60000);

// Плохо: объясняет очевидное
// Устанавливаем переменную в true
isActive = true;
```

### Обработка ошибок

```javascript
// === ХОРОШО ===

// 1. Всегда используйте try-catch для async функций
async function loadData() {
    try {
        const data = await fetchData();
        return data;
    } catch (error) {
        console.error('Failed to load data:', error);
        throw error; // Пробрасываем дальше если нужно
    }
}

// 2. Специфичные сообщения об ошибках
if (!username) {
    throw new Error('Username is required');
}

// 3. Логирование с контекстом
console.error('Failed to save chat:', chatId, error);


// === ПЛОХО ===

// 1. Нет обработки ошибок
async function loadData() {
    const data = await fetchData(); // Может упасть
    return data;
}

// 2. Общие сообщения
if (!username) {
    throw new Error('Error');
}

// 3. Логирование без контекста
console.error(error);
```

---

## 🏗️ Архитектура

### Принципы

1. **Модульность** — каждый файл отвечает за одну область
2. **Разделение ответственности** — UI, логика, данные отдельно
3. **Независимость** — минимум зависимостей между модулями
4. **Расширяемость** — легко добавлять новые функции

### Слои приложения

```
┌─────────────────────────────────────┐
│           UI Layer                  │
│  (HTML, CSS, DOM manipulation)      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│        Business Logic Layer         │
│  (script.js, features.js)           │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Data Layer                  │
│  (stable-database.js, adapters)     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│        Storage Layer                │
│  (IndexedDB, localStorage)          │
└─────────────────────────────────────┘
```

### Добавление новой функции

#### 1. Определите слой

- **UI** — новый элемент интерфейса?
- **Logic** — новая бизнес-логика?
- **Data** — новая таблица в БД?

#### 2. Создайте модуль

```javascript
// new-feature.js

// === CONSTANTS ===
const FEATURE_CONFIG = {
    enabled: true,
    timeout: 5000
};

// === CLASS ===
class NewFeature {
    constructor() {
        this.state = null;
    }

    async init() {
        // Инициализация
    }

    async doSomething() {
        // Основная логика
    }
}

// === INITIALIZATION ===
const newFeature = new NewFeature();

// === EXPORTS ===
window.newFeature = newFeature;
```

#### 3. Подключите в HTML

```html
<!-- В правильном порядке зависимостей -->
<script src="stable-database.js"></script>
<script src="new-feature.js"></script>
<script src="script.js"></script>
```

#### 4. Интегрируйте

```javascript
// В script.js или features-integration.js
document.addEventListener('DOMContentLoaded', async () => {
    await newFeature.init();
});
```

---

## 🔄 Процесс разработки

### Git workflow

#### Ветки

```bash
main          # Продакшн, всегда стабильная
develop       # Разработка, интеграция фич
feature/*     # Новые функции
bugfix/*      # Исправления багов
hotfix/*      # Срочные исправления в продакшне
```

#### Создание feature

```bash
# 1. Создать ветку от develop
git checkout develop
git pull origin develop
git checkout -b feature/new-awesome-feature

# 2. Разработка
# ... пишем код ...

# 3. Коммиты
git add .
git commit -m "feat: add awesome feature"

# 4. Push
git push origin feature/new-awesome-feature

# 5. Создать Pull Request
# develop ← feature/new-awesome-feature
```

#### Формат коммитов

```bash
# Типы:
feat:     # Новая функция
fix:      # Исправление бага
docs:     # Документация
style:    # Форматирование (не влияет на код)
refactor: # Рефакторинг
perf:     # Оптимизация производительности
test:     # Тесты
chore:    # Рутинные задачи (обновление зависимостей)

# Примеры:
git commit -m "feat: add voice input support"
git commit -m "fix: session not restoring after page reload"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify chat loading logic"
git commit -m "perf: optimize database queries"
```

### Code Review

#### Чеклист для автора PR

- [ ] Код следует стандартам проекта
- [ ] Добавлены комментарии к сложной логике
- [ ] Нет console.log (кроме важных логов)
- [ ] Нет закомментированного кода
- [ ] Обновлена документация (если нужно)
- [ ] Протестировано в браузере
- [ ] Нет ошибок в консоли
- [ ] Работает на мобильных устройствах

#### Чеклист для ревьюера

- [ ] Код понятен и читаем
- [ ] Нет дублирования кода
- [ ] Обработаны ошибки
- [ ] Нет уязвимостей безопасности
- [ ] Производительность приемлема
- [ ] Соответствует архитектуре проекта

---

## 🧪 Тестирование

### Ручное тестирование

#### Чеклист перед коммитом

```bash
# 1. Запустить проект
npm start

# 2. Открыть в браузере
http://localhost:3000

# 3. Проверить консоль (F12)
# Не должно быть ошибок

# 4. Проверить IndexedDB (F12 → Application)
# Данные сохраняются корректно

# 5. Проверить основные сценарии:
- [ ] Регистрация нового пользователя
- [ ] Вход в систему
- [ ] Создание чата
- [ ] Отправка сообщения
- [ ] Получение ответа от AI
- [ ] Переключение модели
- [ ] Веб-поиск
- [ ] Загрузка файла
- [ ] Удаление чата
- [ ] Выход из системы

# 6. Проверить на мобильном (F12 → Device Toolbar)
- [ ] Адаптивность
- [ ] Сайдбар работает
- [ ] Кнопки кликабельны

# 7. Проверить в разных браузерах
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
```

### Тестирование синхронизации

```bash
# 1. Открыть сайт в двух вкладках
# 2. В первой вкладке создать чат
# 3. Во второй вкладке должно появиться уведомление
# 4. Список чатов обновился в обеих вкладках
```

### Тестирование сессий

```bash
# 1. Войти в систему
# 2. Закрыть браузер
# 3. Открыть снова
# 4. Должен остаться авторизованным
```

---

## 🚀 Деплой

### Локальный деплой

```bash
# Продакшн режим
NODE_ENV=production npm start
```

### Render.com

```bash
# 1. Создать аккаунт на render.com
# 2. New → Web Service
# 3. Подключить GitHub репозиторий
# 4. Настройки:
#    - Build Command: npm install
#    - Start Command: npm start
# 5. Environment Variables:
#    - API_URL
#    - API_KEY
#    - TAVILY_KEY
# 6. Deploy
```

### Railway.app

```bash
# 1. Создать аккаунт на railway.app
# 2. New Project → Deploy from GitHub
# 3. Выбрать репозиторий
# 4. Variables → Add:
#    - API_URL
#    - API_KEY
#    - TAVILY_KEY
# 5. Автоматический деплой
```

---

## ❓ Частые вопросы

### Как добавить новую AI модель?

```javascript
// 1. Добавить в config.js
const MODELS = {
    'kc/new-model/model-name': {
        name: 'Model Display Name',
        category: 'openai', // или llama, qwen, other
        description: 'Model description',
        maxTokens: 128000,
        hasVision: false,
        hasThinking: false
    }
};

// 2. Добавить промпт в prompts.js
const SYSTEM_PROMPTS = {
    'kc/new-model/model-name': 'System prompt for this model...'
};

// 3. Готово! Модель появится в селекторе
```

### Как добавить новую таблицу в БД?

```javascript
// 1. Обновить версию в stable-database.js
this.version = 4; // было 3

// 2. Добавить в onupgradeneeded
if (!db.objectStoreNames.contains('new_table')) {
    const newStore = db.createObjectStore('new_table', { keyPath: 'id' });
    newStore.createIndex('userId', 'userId', { unique: false });
}

// 3. Добавить методы для работы с таблицей
async saveToNewTable(data) {
    return await this.safeWrite('new_table', data);
}

async getFromNewTable(id) {
    return await this.read('new_table', id);
}
```

### Как отладить проблему с БД?

```javascript
// 1. Открыть DevTools (F12)
// 2. Application → Storage → IndexedDB → BreadixAI_Stable
// 3. Посмотреть содержимое таблиц
// 4. Проверить консоль на ошибки

// Для сброса БД:
indexedDB.deleteDatabase('BreadixAI_Stable');
location.reload();
```

### Как добавить новую страницу?

```html
<!-- 1. Создать new-page.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>New Page</h1>
    
    <script src="script.js"></script>
</body>
</html>

<!-- 2. Добавить ссылку в index.html -->
<a href="new-page.html">Go to New Page</a>
```

### Как изменить тему?

```css
/* В style.css изменить CSS переменные */
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --text-primary: #000000;
    /* ... */
}

[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --text-primary: #ffffff;
    /* ... */
}
```

---

## 📞 Поддержка

### Нашли баг?

1. Проверьте [Issues](https://github.com/yourusername/breadixai/issues)
2. Если нет похожего — создайте новый Issue
3. Опишите:
   - Что делали
   - Что ожидали
   - Что получили
   - Скриншоты/логи

### Есть вопрос?

1. Проверьте документацию
2. Спросите в [Discussions](https://github.com/yourusername/breadixai/discussions)
3. Свяжитесь с автором: [@Breadixx](https://t.me/Breadixx)

---

## 📚 Полезные ресурсы

### Документация проекта
- `README.md` — общий обзор
- `PROJECT_STRUCTURE.md` — структура проекта
- `DATABASE_V3.md` — работа с базой данных
- `FEATURES.md` — список функций

### Внешние ресурсы
- [MDN Web Docs](https://developer.mozilla.org/) — документация по Web API
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Express.js](https://expressjs.com/)
- [Node.js](https://nodejs.org/)

---

**Спасибо за вклад в проект!** 🎉

**Автор:** Breadix  
**Дата:** 19 апреля 2026  
**Версия:** 3.0.0
