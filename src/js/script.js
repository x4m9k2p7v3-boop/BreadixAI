/**
 * BreadixAI - Main Application Script
 *
 * Основная логика приложения для работы с AI чатами.
 * Управляет чатами, сообщениями, UI и взаимодействием с API.
 *
 * @author Breadix
 * @version 3.0.0
 */

// === GLOBAL STATE ===
let chatHistory = [];           // История всех чатов пользователя
let currentChatId = null;       // ID текущего открытого чата
let searchEnabled = false;      // Включен ли веб-поиск
let isGenerating = false;       // Идет ли генерация ответа
let currentModel = 'kr/claude-sonnet-4.5'; // Текущая выбранная модель
let attachedFiles = [];         // Прикрепленные файлы
let modelTokens = {};           // Счетчик токенов по моделям: { modelId: tokenCount }

// === DOM ELEMENTS ===
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const emptyState = document.getElementById('emptyState');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const newChatFloating = document.getElementById('newChatFloating');
const chatHistoryContainer = document.getElementById('chatHistory');
const searchBtn = document.getElementById('searchBtn');
const modelSelectorInlineBtn = document.getElementById('modelSelectorInlineBtn');
const currentModelNameInline = document.getElementById('currentModelNameInline');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const attachedFilesContainer = document.getElementById('attachedFiles');

// === INITIALIZATION ===
/**
 * Инициализация приложения при загрузке страницы
 * Проверяет авторизацию, инициализирует БД, загружает данные
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Параллельная инициализация БД
        await Promise.all([
            stableDB.init(),
            dbAdapter.init()
        ]);

        // Ждем инициализации sessionManager если он есть
        if (window.sessionManager && !window.sessionManager.initialized) {
            await Promise.race([
                new Promise(resolve => {
                    const checkInit = setInterval(() => {
                        if (window.sessionManager.initialized) {
                            clearInterval(checkInit);
                            resolve();
                        }
                    }, 50);
                }),
                new Promise(resolve => setTimeout(resolve, 2000)) // Таймаут 2 секунды
            ]);
        }

        // Проверка сессии через session-manager
        let isLoggedIn = false;
        if (window.sessionManager) {
            const session = await sessionManager.restoreSession();
            isLoggedIn = session !== null;
        } else {
            // Fallback на localStorage
            isLoggedIn = localStorage.getItem('breadixai_logged_in') === 'true';
        }

        if (!isLoggedIn) {
            window.location.href = 'pages/sign_in.html';
            return;
        }

        // Миграция данных из localStorage в IndexedDB (один раз)
        const migrated = await stableDB.getAppSetting('migration_completed');
        if (!migrated) {
            await stableDB.migrateFromLocalStorage();
            await stableDB.saveAppSetting('migration_completed', true);
        }

        // Параллельная загрузка данных и настройка UI
        await Promise.all([
            loadChatHistory(),
            loadCurrentChatId()
        ]);

        // Синхронные операции UI (быстрые)
        loadSelectedModel();
        loadSearchState();
        loadModelTokens();
        setupEventListeners();
        autoResizeTextarea();
        createModelDropdownInline();
        updateModelDisplay();
        initUserMenu();
        updateTokenCounter();

        // Убираем экран загрузки только когда всё готово
        hideLoadingScreen();
    } catch (error) {
        console.error('Initialization error:', error);
        hideLoadingScreen();
    }
});

function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', createNewChat);
    newChatFloating.addEventListener('click', createNewChat);
    // sidebarToggle handler moved to features-integration.js for animation

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        sendBtn.disabled = !messageInput.value.trim();
    });

    searchBtn.addEventListener('click', () => {
        searchEnabled = !searchEnabled;
        searchBtn.classList.toggle('active');
        saveSearchState();
        if (searchEnabled) {
            showToast('Поиск в интернете включен', 'search');
        } else {
            showToast('Поиск в интернете выключен', 'search');
        }
    });

    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            messageInput.value = chip.textContent.trim();
            messageInput.focus();
            sendBtn.disabled = false;
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu') && !e.target.closest('.chat-menu-btn')) {
            closeContextMenu();
        }
        if (!e.target.closest('.model-dropdown-inline') && !e.target.closest('.model-selector-inline-btn')) {
            closeModelDropdownInline();
        }
    });

    if (modelSelectorInlineBtn) {
        modelSelectorInlineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModelDropdownInline();
        });
    }

    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    messageInput.addEventListener('paste', handlePaste);
}

async function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
                try {
                    const fileData = await readFile(file);
                    attachedFiles.push({
                        name: file.name || 'pasted-image.png',
                        size: file.size,
                        type: file.type,
                        data: fileData
                    });
                    updateAttachedFilesDisplay();
                    showToast('Изображение вставлено', 'check');
                } catch (error) {
                    showToast('Ошибка при вставке изображения', 'error');
                }
            }
        }
    }
}

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('open');
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if ((!message && attachedFiles.length === 0) || isGenerating) return;

    const maxTokens = MODELS[currentModel]?.maxTokens || 128000;
    const currentTokens = modelTokens[currentModel] || 0;
    if (currentTokens >= maxTokens) {
        showTokenLimitModal();
        return;
    }

    if (emptyState.style.display !== 'none') {
        emptyState.style.display = 'none';
        messagesContainer.style.display = 'block';
    }

    if (!currentChatId) {
        currentChatId = Date.now().toString();
        const title = message.substring(0, 50) + (message.length > 50 ? '...' : '') || 'Новый чат с файлами';
        chatHistory.unshift({
            id: currentChatId,
            title: title,
            timestamp: Date.now(),
            messages: []
        });
        updateChatHistory();
        saveCurrentChatId();

        // Уведомляем другие вкладки о создании чата
        if (window.syncManager) {
            syncManager.notifyChatCreated(currentChatId, title);
        }
    }

    let fullMessage = message;
    let hasImages = false;

    if (attachedFiles.length > 0) {
        hasImages = attachedFiles.some(f => f.data.type === 'image');

        if (!hasImages) {

            fullMessage += '\n\n--- Прикрепленные файлы ---\n';
            for (const file of attachedFiles) {
                fullMessage += `\n--- Файл: ${file.name} ---\n${file.data.content}\n`;
            }
        }
    }

    await addUserMessage(message, attachedFiles.length > 0 ? [...attachedFiles] : null);

    const filesToSend = hasImages ? [...attachedFiles] : null;

    const userTokens = estimateTokens(fullMessage);
    if (!modelTokens[currentModel]) {
        modelTokens[currentModel] = 0;
    }
    modelTokens[currentModel] += userTokens;
    updateTokenCounter();
    saveModelTokens();

    messageInput.value = '';
    attachedFiles = [];
    updateAttachedFilesDisplay();
    autoResizeTextarea();
    sendBtn.disabled = true;
    isGenerating = true;

    sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
        </svg>
    `;

    const typingId = addTypingIndicator();

    try {
        const response = await callAIModel(fullMessage, filesToSend);
        removeTypingIndicator(typingId);
        await streamAIMessageFromAPI(response);
    } catch (error) {
        removeTypingIndicator(typingId);
        showToast('Ошибка при получении ответа от API', 'error');

        isGenerating = false;
        sendBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        `;
        messageInput.focus();
    }
}

async function addUserMessage(content, files = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';

    let messageHTML = `<div class="message-content">${escapeHtml(content)}`;

    if (files && files.length > 0) {
        messageHTML += '<div class="user-files">';
        files.forEach(file => {
            if (file.data.type === 'image') {
                messageHTML += `
                    <div class="user-file-item image">
                        <img src="${file.data.content}" alt="${escapeHtml(file.name)}" />
                        <span class="user-file-name">${escapeHtml(file.name)}</span>
                    </div>
                `;
            } else {
                messageHTML += `
                    <div class="user-file-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span class="user-file-name">${escapeHtml(file.name)}</span>
                    </div>
                `;
            }
        });
        messageHTML += '</div>';
    }

    messageHTML += '</div>';
    messageDiv.innerHTML = messageHTML;

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    await saveMessageToChat('user', content);
}

async function streamAIMessageFromAPI(response) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const modelName = getModelName(currentModel);

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <img src="public/BreadixWebSite.png" alt="AI">
        </div>
        <div class="message-body">
            <div class="model-badge">${modelName}</div>
            <div class="thinking-block" style="display: none;">
                <div class="thinking-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4m0-4h.01"></path>
                    </svg>
                    <span>Думаю...</span>
                    <span class="thinking-time"></span>
                    <button class="thinking-toggle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
                <div class="thinking-content"></div>
            </div>
            <div class="message-content"></div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
    const contentDiv = messageDiv.querySelector('.message-content');
    const thinkingBlock = messageDiv.querySelector('.thinking-block');
    const thinkingContent = messageDiv.querySelector('.thinking-content');
    const thinkingToggle = messageDiv.querySelector('.thinking-toggle');
    const thinkingTimeSpan = messageDiv.querySelector('.thinking-time');

    let fullContent = '';
    let thinkingText = '';
    let thinkingStartTime = null;
    let thinkingEndTime = null;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    thinkingToggle.addEventListener('click', () => {
        thinkingContent.classList.toggle('collapsed');
        thinkingToggle.classList.toggle('collapsed');
    });

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();

                    if (data === '[DONE]') {
                        break;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        const reasoningContent = parsed.choices?.[0]?.delta?.reasoning_content;

                        if (reasoningContent) {
                            if (!thinkingStartTime) {
                                thinkingStartTime = Date.now();
                            }
                            thinkingBlock.style.display = 'block';
                            thinkingText += reasoningContent;
                            thinkingContent.textContent = thinkingText + '▋';

                            const elapsed = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);
                            thinkingTimeSpan.textContent = `${elapsed}s`;

                            scrollToBottom();
                        }

                        if (content) {
                            if (thinkingStartTime && !thinkingEndTime) {
                                thinkingEndTime = Date.now();
                                const totalTime = ((thinkingEndTime - thinkingStartTime) / 1000).toFixed(1);
                                thinkingTimeSpan.textContent = `${totalTime}s`;
                            }

                            fullContent += content;
                            const parsed = marked.parse(fullContent);

                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = parsed;
                            const lastElement = tempDiv.lastElementChild || tempDiv;
                            if (lastElement.lastChild && lastElement.lastChild.nodeType === Node.TEXT_NODE) {
                                lastElement.lastChild.textContent += '▋';
                            } else {
                                lastElement.innerHTML += '<span class="cursor">▋</span>';
                            }
                            contentDiv.innerHTML = tempDiv.innerHTML;
                            scrollToBottom();
                        }
                    } catch (e) {

                    }
                }
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
        showToast('Ошибка при получении ответа', 'error');
    }

    contentDiv.innerHTML = marked.parse(fullContent);
    if (thinkingText) {
        thinkingContent.textContent = thinkingText;
    }

    const userTokens = estimateTokens(fullContent);
    if (!modelTokens[currentModel]) {
        modelTokens[currentModel] = 0;
    }
    modelTokens[currentModel] += userTokens;
    updateTokenCounter();
    saveModelTokens();

    contentDiv.querySelectorAll('pre code').forEach((block) => {
        const pre = block.parentElement;
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
            <span class="code-lang">code</span>
            <button class="copy-code-btn" onclick="copyCode(this)">Копировать</button>
        `;
        pre.insertBefore(header, block);
    });

    addMessageActions(messageDiv);

    scrollToBottom();
    await saveMessageToChat('ai', fullContent);

    isGenerating = false;
    sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `;
    messageInput.focus();
}

async function streamAIMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    messageDiv.innerHTML = `
        <div class="message-avatar">B</div>
        <div class="message-body">
            <div class="message-content"></div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
    const contentDiv = messageDiv.querySelector('.message-content');

    let currentText = '';
    const words = content.split(' ');

    for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        contentDiv.innerHTML = marked.parse(currentText) + '<span class="cursor">▋</span>';
        scrollToBottom();
        await sleep(30 + Math.random() * 40);
    }

    contentDiv.innerHTML = marked.parse(content);

    contentDiv.querySelectorAll('pre code').forEach((block) => {
        const pre = block.parentElement;
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
            <span class="code-lang">code</span>
            <button class="copy-code-btn" onclick="copyCode(this)">Copy</button>
        `;
        pre.insertBefore(header, block);
    });

    addMessageActions(messageDiv);

    scrollToBottom();
    await saveMessageToChat('ai', content);

    isGenerating = false;
    sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `;
    messageInput.focus();
}

function addMessageActions(messageDiv) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';

    actionsDiv.innerHTML = `
        <button class="action-btn" title="Copy" onclick="copyMessage(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        </button>
        <button class="action-btn" title="Regenerate" onclick="regenerateMessage(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
        </button>
        <button class="action-btn" title="Like" onclick="toggleLike(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
        </button>
        <button class="action-btn" title="Dislike" onclick="toggleDislike(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
            </svg>
        </button>
    `;

    messageDiv.querySelector('.message-body').appendChild(actionsDiv);
}

window.copyCode = function(btn) {
    const pre = btn.closest('pre');
    const code = pre.querySelector('code');
    navigator.clipboard.writeText(code.textContent);
    btn.textContent = 'Скопировано!';
    setTimeout(() => btn.textContent = 'Копировать', 2000);
    showToast('Код скопирован в буфер обмена', 'copy');
};

window.copyMessage = function(btn) {
    const content = btn.closest('.message').querySelector('.message-content');
    const text = content.textContent;
    navigator.clipboard.writeText(text);
    showToast('Сообщение скопировано в буфер обмена', 'copy');
};

window.regenerateMessage = function(btn) {
    showToast('Генерация нового ответа...', 'refresh');
};

window.toggleLike = function(btn) {
    btn.classList.toggle('active');
    const dislikeBtn = btn.nextElementSibling;
    if (dislikeBtn) dislikeBtn.classList.remove('active');

    if (btn.classList.contains('active')) {
        showToast('Отзыв записан', 'like');
    }
};

window.toggleDislike = function(btn) {
    btn.classList.toggle('active');
    const likeBtn = btn.previousElementSibling;
    if (likeBtn) likeBtn.classList.remove('active');

    if (btn.classList.contains('active')) {
        showToast('Отзыв записан', 'dislike');
    }
};

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'message ai';

    const hasThinking = MODELS[currentModel]?.hasThinking;

    if (hasThinking) {
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="public/BreadixWebSite.png" alt="AI">
            </div>
            <div class="message-body">
                <div class="message-content">
                    <div class="typing-indicator">
                        <span class="thinking-text">Думаю...</span>
                        <span class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    } else {

        const thinkingPhrase = getContextualThinkingPhrase();
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="public/BreadixWebSite.png" alt="AI">
            </div>
            <div class="message-body">
                <div class="message-content">
                    <div class="typing-indicator">
                        <span class="thinking-text">${thinkingPhrase}</span>
                        <span class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    messagesContainer.appendChild(typingDiv);
    scrollToBottom();

    if (!hasThinking) {
        startThinkingAnimation(typingId);
    }

    return typingId;
}

function getContextualThinkingPhrase() {
    const chat = chatHistory.find(c => c.id === currentChatId);
    const lastMessage = chat?.messages[chat.messages.length - 1]?.content.toLowerCase() || '';

    if (searchEnabled || lastMessage.includes('найди') || lastMessage.includes('поищи') || lastMessage.includes('найти')) {
        return 'Ищу информацию...';
    }

    if (lastMessage.includes('код') || lastMessage.includes('функци') || lastMessage.includes('программ') ||
        lastMessage.includes('script') || lastMessage.includes('python') || lastMessage.includes('javascript')) {
        return 'Анализирую код...';
    }

    if (attachedFiles.length > 0) {
        return 'Читаю файлы...';
    }

    if (lastMessage.includes('объясни') || lastMessage.includes('расскажи') || lastMessage.includes('что такое')) {
        return 'Формирую объяснение...';
    }

    if (lastMessage.includes('перевед') || lastMessage.includes('translate')) {
        return 'Перевожу текст...';
    }

    if (lastMessage.includes('напиши') || lastMessage.includes('создай') || lastMessage.includes('сгенерируй')) {
        return 'Создаю текст...';
    }

    if (lastMessage.includes('проанализируй') || lastMessage.includes('сравни') || lastMessage.includes('оцени')) {
        return 'Анализирую данные...';
    }

    const defaultPhrases = [
        'Обрабатываю запрос...',
        'Формирую ответ...',
        'Анализирую вопрос...',
        'Подбираю информацию...'
    ];

    return defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
}

function startThinkingAnimation(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (!typingDiv) return;

    const thinkingTextEl = typingDiv.querySelector('.thinking-text');
    if (!thinkingTextEl) return;

    const phrases = [
        thinkingTextEl.textContent, // Keep initial phrase
        'Обрабатываю информацию...',
        'Формирую ответ...',
        'Почти готово...'
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
        if (!document.getElementById(typingId)) {
            clearInterval(interval);
            return;
        }

        currentIndex = (currentIndex + 1) % phrases.length;
        if (thinkingTextEl) {
            thinkingTextEl.textContent = phrases[currentIndex];
        }
    }, 3000); // Change phrase every 3 seconds

    typingDiv.dataset.thinkingInterval = interval;
}

function removeTypingIndicator(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) {

        if (typingDiv.dataset.thinkingInterval) {
            clearInterval(parseInt(typingDiv.dataset.thinkingInterval));
        }
        typingDiv.remove();
    }
}

async function callAIModel(userMessage, files = null) {
    const chat = chatHistory.find(c => c.id === currentChatId);
    const messages = [];

    const systemPrompt = MODEL_PROMPTS[currentModel] || `Ты полезный AI-ассистент. Сегодня ${new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}.`;

    // System prompt теперь НЕ добавляется в messages
    // Он будет передан отдельным полем в requestBody

    let searchResults = '';
    if (searchEnabled) {
        try {
            searchResults = await performWebSearch(userMessage);
            if (searchResults) {
                // Результаты поиска добавляем к system prompt
                // НЕ как отдельное сообщение
            }
        } catch (error) {
            console.error('Search error:', error);
            showToast('Ошибка поиска, отвечаю без интернета', 'error');
        }
    }

    if (chat && chat.messages) {
        chat.messages.forEach(msg => {
            messages.push({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            });
        });
    }

    const hasVision = MODELS[currentModel]?.hasVision;
    if (files && files.length > 0 && hasVision) {

        const content = [];

        if (userMessage) {
            content.push({
                type: 'text',
                text: userMessage
            });
        }

        files.forEach(file => {
            if (file.data.type === 'image') {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: file.data.content
                    }
                });
            }
        });

        messages.push({
            role: 'user',
            content: content
        });
    } else {

        messages.push({
            role: 'user',
            content: userMessage
        });
    }

    try {
        // Формируем финальный system prompt с результатами поиска если есть
        let finalSystemPrompt = systemPrompt;
        if (searchResults) {
            finalSystemPrompt += `\n\nРезультаты поиска в интернете:\n\n${searchResults}\n\nИспользуй эту информацию для ответа на вопрос пользователя.`;
        }

        const requestBody = {
            model: currentModel,
            system: finalSystemPrompt,  // System prompt в отдельном поле
            messages: messages,          // Только user/assistant сообщения
            stream: true,
            temperature: 0.7
        };

        const response = await fetch(API_CONFIG.fullChatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

async function performWebSearch(query) {
    try {

        const response = await fetch(API_CONFIG.fullSearchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                search_depth: 'basic',
                max_results: 5
            })
        });

        if (!response.ok) {
            throw new Error(`Search API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return '';
        }

        let formattedResults = '';
        data.results.forEach((result, index) => {
            formattedResults += `${index + 1}. ${result.title}\n`;
            formattedResults += `   ${result.content}\n`;
            formattedResults += `   Источник: ${result.url}\n\n`;
        });

        return formattedResults;
    } catch (error) {
        console.error('Tavily search error:', error);
        throw error;
    }
}

function createNewChat() {
    currentChatId = null;
    messagesContainer.innerHTML = '';
    messagesContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    messageInput.value = '';
    sendBtn.disabled = true;
    messageInput.focus();

    modelTokens[currentModel] = 0;
    updateTokenCounter();
    saveModelTokens();

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });

    saveCurrentChatId();
    showToast('Новый чат создан', 'plus');
}

// Export globally for features-integration.js
window.createNewChat = createNewChat;

function updateChatHistory() {
    chatHistoryContainer.innerHTML = '';

    const groups = groupChatsByTime(chatHistory);

    Object.keys(groups).forEach(groupName => {
        if (groups[groupName].length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'chat-group';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'chat-group-title';
        titleDiv.textContent = groupName;
        groupDiv.appendChild(titleDiv);

        groups[groupName].forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (chat.id === currentChatId) {
                chatItem.classList.add('active');
            }

            chatItem.innerHTML = `
                <svg class="chat-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="chat-item-text">${escapeHtml(chat.title)}</span>
                <div class="chat-item-menu">
                    <button class="chat-menu-btn" onclick="showChatMenu(event, '${chat.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                            <circle cx="12" cy="19" r="2"></circle>
                        </svg>
                    </button>
                </div>
            `;

            chatItem.querySelector('.chat-item-text').addEventListener('click', () => loadChat(chat.id));
            groupDiv.appendChild(chatItem);
        });

        chatHistoryContainer.appendChild(groupDiv);
    });
}

window.showChatMenu = function(event, chatId) {
    event.stopPropagation();
    closeContextMenu();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.id = 'contextMenu';
    menu.innerHTML = `
        <div class="context-menu-item" onclick="renameChat('${chatId}')">Переименовать</div>
        <div class="context-menu-item danger" onclick="deleteChat('${chatId}')">Удалить</div>
    `;

    document.body.appendChild(menu);

    const rect = event.target.closest('.chat-menu-btn').getBoundingClientRect();
    menu.style.left = rect.right + 8 + 'px';
    menu.style.top = rect.top + 'px';
};

function closeContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.remove();
}

window.renameChat = async function(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    const newTitle = await NotificationSystem.prompt('Введите новое название чата:', chat.title, 'Переименовать чат');
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        await saveChatHistory();
        updateChatHistory();
        showToast('Чат переименован', 'check');

        // Уведомляем другие вкладки
        if (window.syncManager) {
            syncManager.notifyChatUpdated(chatId);
        }
    }
    closeContextMenu();
};

window.deleteChat = async function(chatId) {
    const confirmed = await NotificationSystem.confirm('Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.', 'Удаление чата');
    if (!confirmed) return;

    chatHistory = chatHistory.filter(c => c.id !== chatId);
    if (currentChatId === chatId) {
        createNewChat();
    }
    await saveChatHistory();
    await dbAdapter.deleteChat(chatId);
    updateChatHistory();
    closeContextMenu();
    showToast('Чат удалён', 'check');

    // Уведомляем другие вкладки
    if (window.syncManager) {
        syncManager.notifyChatDeleted(chatId);
    }
};

function groupChatsByTime(chats) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const groups = {
        'Сегодня': [],
        'Вчера': [],
        'Последние 7 дней': [],
        'Старые': []
    };

    chats.forEach(chat => {
        const diff = now - chat.timestamp;

        if (diff < oneDay) {
            groups['Сегодня'].push(chat);
        } else if (diff < 2 * oneDay) {
            groups['Вчера'].push(chat);
        } else if (diff < sevenDays) {
            groups['Последние 7 дней'].push(chat);
        } else {
            groups['Старые'].push(chat);
        }
    });

    return groups;
}

function loadChat(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    currentChatId = chatId;
    messagesContainer.innerHTML = '';
    emptyState.style.display = 'none';
    messagesContainer.style.display = 'block';

    chat.messages.forEach(msg => {
        if (msg.role === 'user') {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user';
            messageDiv.innerHTML = `<div class="message-content">${escapeHtml(msg.content)}</div>`;
            messagesContainer.appendChild(messageDiv);
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai';
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="public/BreadixWebSite.png" alt="AI">
                </div>
                <div class="message-body">
                    <div class="message-content">${marked.parse(msg.content)}</div>
                </div>
            `;
            addMessageActions(messageDiv);
            messagesContainer.appendChild(messageDiv);
        }
    });

    updateChatHistory();
    saveCurrentChatId();
    scrollToBottom();
    updateTokenCounter();
}

async function saveMessageToChat(role, content) {
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.push({ role, content, timestamp: new Date().toISOString() });
        await saveChatHistory();
        updateTokenCounter();
    }
}

async function saveChatHistory() {
    await dbAdapter.saveChats(chatHistory);
}

async function loadChatHistory() {
    chatHistory = await dbAdapter.loadChats();
    updateChatHistory();
}

function saveCurrentChatId() {
    if (currentChatId) {
        dbAdapter.saveCurrentChatId(currentChatId);
        // Также сохраняем в IndexedDB
        stableDB.saveAppSetting('current_chat', currentChatId);
    } else {
        localStorage.removeItem('breadixai_current_chat');
        stableDB.deleteAppSetting('current_chat');
    }
}

async function loadCurrentChatId() {
    // Пробуем загрузить из IndexedDB
    let savedChatId = await stableDB.getAppSetting('current_chat');

    // Fallback на localStorage
    if (!savedChatId) {
        savedChatId = dbAdapter.loadCurrentChatId();
    }

    if (savedChatId && chatHistory.length > 0) {
        const chat = chatHistory.find(c => c.id === savedChatId);
        if (chat) {
            loadChat(savedChatId);
        }
    }
}

async function saveSearchState() {
    await stableDB.saveAppSetting('search_enabled', searchEnabled);

    // Уведомляем другие вкладки
    if (window.syncManager) {
        syncManager.notifySettingsChanged({ search_enabled: searchEnabled });
    }
}

async function loadSearchState() {
    const saved = await stableDB.getAppSetting('search_enabled');
    if (saved === true) {
        searchEnabled = true;
        searchBtn.classList.add('active');
    }
}

async function saveModelTokens() {
    await stableDB.saveAppSetting('model_tokens', modelTokens);
}

async function loadModelTokens() {
    const saved = await stableDB.getAppSetting('model_tokens');
    if (saved) {
        modelTokens = saved;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showToast(message, icon = 'check') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';

    const icons = {
        check: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        copy: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        like: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>',
        dislike: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>',
        refresh: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
        search: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
        brain: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4m0-4h.01"></path></svg>',
        plus: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };

    toast.innerHTML = `
        ${icons[icon] || icons.check}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function loadSelectedModel() {
    const saved = localStorage.getItem('breadixai_model');
    if (saved && MODELS[saved]) {
        currentModel = saved;
    }
}

function saveSelectedModel() {
    localStorage.setItem('breadixai_model', currentModel);
}

function selectModel(modelId) {
    currentModel = modelId;
    saveSelectedModel();
    updateModelDisplay();
    updateTokenCounter(); // Update token counter for new model
    closeModelDropdownInline();

    const modelName = getModelName(modelId);
    showToast(`Модель изменена: ${modelName}`, 'check');

    document.querySelectorAll('.model-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.model-option').classList.add('active');
}

function updateModelDisplay() {
    if (currentModelNameInline) {
        currentModelNameInline.textContent = getModelName(currentModel);
    }
}

function createModelDropdownInline() {
    const dropdown = document.createElement('div');
    dropdown.className = 'model-dropdown-inline';
    dropdown.id = 'modelDropdownInline';

    const categories = {
        'flagship': 'Флагманские',
        'advanced': 'Продвинутые',
        'fast': 'Быстрые'
    };

    Object.entries(categories).forEach(([categoryKey, categoryName]) => {
        const models = getModelsByCategory(categoryKey);
        if (models.length === 0) return;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'model-category';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'model-category-title';
        titleDiv.textContent = categoryName;
        categoryDiv.appendChild(titleDiv);

        models.forEach(model => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'model-option';
            if (model.id === currentModel) {
                optionDiv.classList.add('active');
            }

            optionDiv.innerHTML = `
                <div class="model-option-name">${model.name}</div>
                <div class="model-option-desc">${model.description}</div>
            `;

            optionDiv.addEventListener('click', () => {
                selectModel(model.id);
                closeModelDropdownInline();
            });

            categoryDiv.appendChild(optionDiv);
        });

        dropdown.appendChild(categoryDiv);
    });

    document.getElementById('modelSelectorInline').appendChild(dropdown);
}

function toggleModelDropdownInline() {
    const dropdown = document.getElementById('modelDropdownInline');
    const button = document.getElementById('modelSelectorInlineBtn');

    dropdown.classList.toggle('show');
    button.classList.toggle('open');
}

function closeModelDropdownInline() {
    const dropdown = document.getElementById('modelDropdownInline');
    const button = document.getElementById('modelSelectorInlineBtn');

    if (dropdown) {
        dropdown.classList.remove('show');
    }
    if (button) {
        button.classList.remove('open');
    }
}

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);

    for (const file of files) {

        if (file.size > 10 * 1024 * 1024) {
            showToast(`Файл ${file.name} слишком большой (макс. 10MB)`, 'error');
            continue;
        }

        try {
            const fileData = await readFile(file);
            attachedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                data: fileData
            });

            showToast(`Файл ${file.name} прикреплен`, 'check');
        } catch (error) {
            showToast(`Ошибка чтения файла ${file.name}`, 'error');
        }
    }

    updateAttachedFilesDisplay();
    fileInput.value = ''; // Reset input
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        if (file.type.startsWith('image/')) {
            reader.onload = (e) => {
                resolve({
                    type: 'image',
                    content: e.target.result // base64
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        } else {

            reader.onload = (e) => {
                resolve({
                    type: 'text',
                    content: e.target.result
                });
            };
            reader.onerror = reject;
            reader.readAsText(file);
        }
    });
}

function updateAttachedFilesDisplay() {
    if (attachedFiles.length === 0) {
        attachedFilesContainer.classList.remove('show');
        attachedFilesContainer.innerHTML = '';
        return;
    }

    attachedFilesContainer.classList.add('show');
    attachedFilesContainer.innerHTML = '';

    attachedFiles.forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'attached-file';

        const icon = file.data.type === 'image'
            ? '<svg class="attached-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
            : '<svg class="attached-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';

        fileDiv.innerHTML = `
            ${icon}
            <span class="attached-file-name">${escapeHtml(file.name)}</span>
            <span class="attached-file-size">${formatFileSize(file.size)}</span>
            <button class="remove-file-btn" onclick="removeAttachedFile(${index})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        attachedFilesContainer.appendChild(fileDiv);
    });
}

window.removeAttachedFile = function(index) {
    attachedFiles.splice(index, 1);
    updateAttachedFilesDisplay();
    showToast('Файл удален', 'check');
};

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function initUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuPopup = document.getElementById('userMenuPopup');
    const userName = document.getElementById('userName');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const helpBtn = document.getElementById('helpBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const accountUsername = document.getElementById('accountUsername');
    const logoutBtnMenu = document.getElementById('logoutBtn');

    if (!userMenuBtn || !userMenuPopup) return;

    const currentUser = localStorage.getItem('breadixai_current_user') || 'Пользователь';
    userName.textContent = currentUser;
    accountUsername.textContent = currentUser;

    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuPopup.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userMenuPopup.contains(e.target)) {
            userMenuPopup.classList.remove('active');
        }
    });

    openSettingsBtn.addEventListener('click', () => {
        userMenuPopup.classList.remove('active');
        settingsModal.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    settingsNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');

            settingsNavItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            settingsTabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });

    helpBtn.addEventListener('click', () => {
        userMenuPopup.classList.remove('active');
        showToast('Справка в разработке', 'info');
    });

    if (logoutBtnMenu) {
        logoutBtnMenu.addEventListener('click', async () => {
            const confirmed = await NotificationSystem.confirm('Вы уверены, что хотите выйти из аккаунта?', 'Выход');
            if (confirmed) {
                localStorage.removeItem('breadixai_logged_in');
                localStorage.removeItem('breadixai_current_user');
                NotificationSystem.toast('До скорой встречи!', 'info', 2000);
                setTimeout(() => {
                    window.location.href = 'pages/sign_in.html';
                }, 500);
            }
        });
    }
}

function estimateTokens(text) {
    if (!text) return 0;

    return Math.ceil(text.length / 4);
}

function calculateChatTokens() {
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat || !chat.messages) return 0;

    let total = 0;
    chat.messages.forEach(msg => {
        total += estimateTokens(msg.content);

        if (msg.files && msg.files.length > 0) {
            msg.files.forEach(file => {
                if (file.data && file.data.content) {
                    total += estimateTokens(file.data.content);
                }
            });
        }
    });

    return total;
}

function updateTokenCounter() {
    const currentTokens = modelTokens[currentModel] || 0;
    const tokenCounter = document.getElementById('tokenCounter');
    const tokenCount = document.getElementById('tokenCount');
    const tokenLimit = document.getElementById('tokenLimit');

    if (tokenCounter && tokenCount && tokenLimit) {
        const maxTokens = MODELS[currentModel]?.maxTokens || 128000;
        tokenCount.textContent = formatNumber(currentTokens);
        tokenLimit.textContent = formatNumber(maxTokens);

        const percentage = (currentTokens / maxTokens) * 100;
        if (percentage >= 100) {
            tokenCounter.classList.add('token-limit-reached');
            tokenCounter.classList.remove('token-warning');
            showTokenLimitModal();
        } else if (percentage >= 90) {
            tokenCounter.classList.add('token-warning');
            tokenCounter.classList.remove('token-limit-reached');
        } else {
            tokenCounter.classList.remove('token-warning', 'token-limit-reached');
        }
    }
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showTokenLimitModal() {
    const modal = document.getElementById('tokenLimitModal');
    if (modal && !modal.classList.contains('active')) {
        modal.classList.add('active');

        const newChatBtn = document.getElementById('newChatFromLimit');
        if (newChatBtn) {
            newChatBtn.onclick = () => {
                modal.classList.remove('active');
                createNewChat();
            };
        }
    }
}

// ========================================
// LOADING SCREEN
// ========================================

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
        }, 300);
    }
}

// ========================================
// RIPPLE EFFECT (DISABLED - CAUSED BUTTON SIZE ISSUES)
// ========================================

/*
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple-effect');

    const existingRipple = button.querySelector('.ripple-effect');
    if (existingRipple) {
        existingRipple.remove();
    }

    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple effect to buttons
document.addEventListener('DOMContentLoaded', () => {
    const rippleButtons = document.querySelectorAll('.send-btn, .new-chat-btn, .mode-pill, .suggestion-chip, .action-btn, .attach-btn, .model-selector-inline-btn');

    rippleButtons.forEach(button => {
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.addEventListener('click', createRipple);
    });
});
*/

console.log('✨ Loading screen loaded!');

// ========================================
// MOBILE OPTIMIZATIONS
// ========================================

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const newChatFloating = document.querySelector('.new-chat-floating');

        if (sidebar && sidebar.classList.contains('open')) {
            // Check if click is outside sidebar and not on toggle buttons
            if (!sidebar.contains(e.target) &&
                e.target !== sidebarToggle &&
                !sidebarToggle?.contains(e.target) &&
                e.target !== newChatFloating &&
                !newChatFloating?.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    }
});

// Prevent body scroll when sidebar is open on mobile
if (sidebar) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (window.innerWidth <= 768) {
                    if (sidebar.classList.contains('open')) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            }
        });
    });

    observer.observe(sidebar, { attributes: true });
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth > 768) {
            // Reset mobile styles on desktop
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
        }
    }, 250);
});

// Improve touch scrolling on iOS
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.addEventListener('touchmove', (e) => {
        const target = e.target;
        const scrollable = target.closest('.chat-container, .messages, .settings-main, .model-dropdown, .chat-history');

        if (!scrollable) {
            e.preventDefault();
        }
    }, { passive: false });
}

console.log('✨ Mobile optimizations loaded!');
