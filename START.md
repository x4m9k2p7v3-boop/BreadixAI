# 🚀 Простая инструкция по запуску BreadixAI

## ЧТО НУЖНО СДЕЛАТЬ (по порядку):

### ШАГ 1: Установить Cloudflare Tunnel

**Зачем:** Чтобы твой локальный OmniRoute был доступен из интернета.

1. Открой: https://github.com/cloudflare/cloudflared/releases/latest
2. Найди файл `cloudflared-windows-amd64.exe`
3. Скачай его
4. Переименуй в `cloudflared.exe`
5. Положи в папку `C:\cloudflared\`

---

### ШАГ 2: Запустить OmniRoute

1. Открой OmniRoute (если еще не открыт)
2. Убедись что он работает на `localhost:20128`
3. **НЕ ЗАКРЫВАЙ** это окно

---

### ШАГ 3: Запустить Cloudflare Tunnel

1. Открой **Командную строку** (Win + R → `cmd`)
2. Введи:
```
cd C:\cloudflared
cloudflared.exe tunnel --url http://localhost:20128
```
3. Жди пока появится строка типа:
```
https://abc-def-123.trycloudflare.com
```
4. **СКОПИРУЙ** этот URL (весь, с https://)
5. **НЕ ЗАКРЫВАЙ** это окно

---

### ШАГ 4: Обновить .env файл

1. Открой файл `C:\Claude-code\project\breadixwebsite\.env` в блокноте
2. Найди строку:
```
API_URL=http://localhost:20128/v1/chat/completions
```
3. Замени на (вставь СВОЙ URL из шага 3):
```
API_URL=https://abc-def-123.trycloudflare.com/v1/chat/completions
```
4. Сохрани файл (Ctrl + S)

---

### ШАГ 5: Проверить что все работает локально

1. Открой **новую** Командную строку (Win + R → `cmd`)
2. Введи:
```
cd C:\Claude-code\project\breadixwebsite
npm start
```
3. Жди пока появится:
```
🚀 BreadixAI Backend running on port 3000
```
4. Открой браузер: http://localhost:3000
5. Попробуй отправить сообщение
6. Если работает — переходи к шагу 6
7. Если НЕ работает — напиши мне что показывает

---

### ШАГ 6: Залить на GitHub

1. Открой **новую** Командную строку
2. Введи по порядку:
```
cd C:\Claude-code\project\breadixwebsite
git add .
git commit -m "Add backend proxy"
git push
```
3. Если просит логин/пароль — введи данные от GitHub

---

### ШАГ 7: Создать аккаунт на Render.com

1. Открой: https://render.com
2. Нажми **"Get Started"**
3. Зарегистрируйся через GitHub (проще всего)
4. Подтверди email

---

### ШАГ 8: Создать Web Service на Render

1. На главной странице Render нажми **"New +"**
2. Выбери **"Web Service"**
3. Нажми **"Connect GitHub"** (если еще не подключен)
4. Найди свой репозиторий `breadixwebsite`
5. Нажми **"Connect"**

---

### ШАГ 9: Настроить Web Service

Заполни поля:

**Name:** `breadixai` (или любое другое)

**Region:** `Frankfurt (EU Central)` (ближе к тебе)

**Branch:** `main`

**Root Directory:** оставь пустым

**Environment:** `Node`

**Build Command:** 
```
npm install
```

**Start Command:**
```
npm start
```

**Plan:** выбери **"Free"**

---

### ШАГ 10: Добавить переменные окружения

1. Прокрути вниз до раздела **"Environment Variables"**
2. Нажми **"Add Environment Variable"** 3 раза
3. Заполни:

**Переменная 1:**
- Key: `API_URL`
- Value: `https://abc-def-123.trycloudflare.com/v1/chat/completions` (ТВОЙ URL из шага 3)

**Переменная 2:**
- Key: `API_KEY`
- Value: `sk-e8b1e35d21c23e73-484be7-f506e652`

**Переменная 3:**
- Key: `TAVILY_KEY`
- Value: `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`

---

### ШАГ 11: Запустить деплой

1. Нажми **"Create Web Service"** внизу страницы
2. Жди 2-5 минут (Render устанавливает все)
3. Следи за логами (они показываются на экране)
4. Когда увидишь `Live` вверху — готово!

---

### ШАГ 12: Проверить что сайт работает

1. Вверху страницы будет URL типа: `https://breadixai.onrender.com`
2. Скопируй его
3. Открой в браузере
4. Зарегистрируйся
5. Отправь тестовое сообщение
6. Если работает — **ГОТОВО!** 🎉

---

## ⚠️ ВАЖНО:

### Что должно быть ВСЕГДА включено:

1. **OmniRoute** — программа должна работать
2. **Cloudflare Tunnel** — командная строка с туннелем НЕ закрывать
3. **Компьютер** — должен быть включен

Если выключишь что-то из этого — сайт перестанет работать.

---

## 🔧 Если что-то не работает:

### Ошибка "API Error 401":
- Проверь что OmniRoute запущен
- Проверь что Cloudflare Tunnel работает
- Проверь что URL в переменных Render правильный

### Ошибка "Connection refused":
- Cloudflare Tunnel не запущен — запусти заново (шаг 3)

### Сайт не открывается:
- Подожди 2-3 минуты (Render может "спать")
- Обнови страницу

---

## 📞 Если ничего не помогло:

Напиши мне:
1. На каком шаге застрял
2. Что показывает (скриншот или текст ошибки)
3. Я помогу разобраться

---

## 🎉 Когда все заработает:

Твой сайт будет доступен по адресу: `https://breadixai.onrender.com`

Можешь делиться этой ссылкой с друзьями!
