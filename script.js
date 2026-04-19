// State
let chatHistory = [];
let currentChatId = null;
let searchEnabled = false;
let isGenerating = false;
let currentModel = 'kc/openai/gpt-4.1-nano'; // Default model
let attachedFiles = []; // Attached files array
let modelTokens = {}; // Token count per model: { modelId: tokenCount }

// Elements
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
const themeToggle = document.getElementById('themeToggle');
const modelSelectorInlineBtn = document.getElementById('modelSelectorInlineBtn');
const currentModelNameInline = document.getElementById('currentModelNameInline');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const attachedFilesContainer = document.getElementById('attachedFiles');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('breadixai_logged_in');
    if (!isLoggedIn) {
        window.location.href = 'sign_in.html';
        return;
    }

    loadChatHistory();
    loadTheme();
    loadSelectedModel();
    loadSearchState();
    loadModelTokens();
    setupEventListeners();
    autoResizeTextarea();
    createModelDropdownInline();
    updateModelDisplay();
    loadCurrentChatId();
    initUserMenu();
    updateTokenCounter();
});

// Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', createNewChat);
    newChatFloating.addEventListener('click', createNewChat);
    sidebarToggle.addEventListener('click', toggleSidebar);

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

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

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            messageInput.value = chip.textContent.trim();
            messageInput.focus();
            sendBtn.disabled = false;
        });
    });

    // Close context menu on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu') && !e.target.closest('.chat-menu-btn')) {
            closeContextMenu();
        }
        if (!e.target.closest('.model-dropdown-inline') && !e.target.closest('.model-selector-inline-btn')) {
            closeModelDropdownInline();
        }
    });

    // Model selector
    if (modelSelectorInlineBtn) {
        modelSelectorInlineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModelDropdownInline();
        });
    }

    // File attachment
    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Handle paste event for images
    messageInput.addEventListener('paste', handlePaste);
}

// Handle paste event
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

// Sidebar
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('open');
}

// Theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    // Default to dark theme if no preference saved
    if (!theme || theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}

// Send Message
async function sendMessage() {
    const message = messageInput.value.trim();
    if ((!message && attachedFiles.length === 0) || isGenerating) return;

    // Check token limit before sending
    const maxTokens = MODELS[currentModel]?.maxTokens || 128000;
    const currentTokens = modelTokens[currentModel] || 0;
    if (currentTokens >= maxTokens) {
        showTokenLimitModal();
        return;
    }

    // Hide empty state
    if (emptyState.style.display !== 'none') {
        emptyState.style.display = 'none';
        messagesContainer.style.display = 'block';
    }

    // Create new chat if needed
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
    }

    // Build message content with files
    let fullMessage = message;
    let hasImages = false;

    if (attachedFiles.length > 0) {
        hasImages = attachedFiles.some(f => f.data.type === 'image');

        if (!hasImages) {
            // Text files only
            fullMessage += '\n\n--- Прикрепленные файлы ---\n';
            for (const file of attachedFiles) {
                fullMessage += `\n--- Файл: ${file.name} ---\n${file.data.content}\n`;
            }
        }
    }

    // Add user message
    addUserMessage(message, attachedFiles.length > 0 ? [...attachedFiles] : null);

    // Save files before clearing
    const filesToSend = hasImages ? [...attachedFiles] : null;

    // Update token count for user message
    const userTokens = estimateTokens(fullMessage);
    if (!modelTokens[currentModel]) {
        modelTokens[currentModel] = 0;
    }
    modelTokens[currentModel] += userTokens;
    updateTokenCounter();
    saveModelTokens();

    // Clear input and files
    messageInput.value = '';
    attachedFiles = [];
    updateAttachedFilesDisplay();
    autoResizeTextarea();
    sendBtn.disabled = true;
    isGenerating = true;

    // Change send button to stop
    sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
        </svg>
    `;

    // Show typing indicator
    const typingId = addTypingIndicator();

    // Call real AI API
    try {
        const response = await callAIModel(fullMessage, filesToSend);
        removeTypingIndicator(typingId);
        await streamAIMessageFromAPI(response);
    } catch (error) {
        removeTypingIndicator(typingId);
        showToast('Ошибка при получении ответа от API', 'error');

        // Reset state
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

// Add User Message
function addUserMessage(content, files = null) {
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

    saveMessageToChat('user', content);
}

// Stream AI Message from Real API (SSE)
async function streamAIMessageFromAPI(response) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const modelName = getModelName(currentModel);

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <img src="BreadixWebSite.png" alt="AI">
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

    // Toggle thinking block
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

                        // Handle reasoning content (thinking)
                        if (reasoningContent) {
                            if (!thinkingStartTime) {
                                thinkingStartTime = Date.now();
                            }
                            thinkingBlock.style.display = 'block';
                            thinkingText += reasoningContent;
                            thinkingContent.textContent = thinkingText + '▋';

                            // Update timer
                            const elapsed = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);
                            thinkingTimeSpan.textContent = `${elapsed}s`;

                            scrollToBottom();
                        }

                        // Handle regular content
                        if (content) {
                            if (thinkingStartTime && !thinkingEndTime) {
                                thinkingEndTime = Date.now();
                                const totalTime = ((thinkingEndTime - thinkingStartTime) / 1000).toFixed(1);
                                thinkingTimeSpan.textContent = `${totalTime}s`;
                            }

                            fullContent += content;
                            const parsed = marked.parse(fullContent);
                            // Add cursor inside the last element, not after
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
                        // Skip invalid JSON
                    }
                }
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
        showToast('Ошибка при получении ответа', 'error');
    }

    // Remove cursor and render final
    contentDiv.innerHTML = marked.parse(fullContent);
    if (thinkingText) {
        thinkingContent.textContent = thinkingText;
    }

    // Update token count for current model
    const userTokens = estimateTokens(fullContent);
    if (!modelTokens[currentModel]) {
        modelTokens[currentModel] = 0;
    }
    modelTokens[currentModel] += userTokens;
    updateTokenCounter();
    saveModelTokens();

    // Add copy buttons to code blocks
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

    // Add action buttons
    addMessageActions(messageDiv);

    scrollToBottom();
    saveMessageToChat('ai', fullContent);

    // Reset send button
    isGenerating = false;
    sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `;
    messageInput.focus();
}

// Stream AI Message (character by character) - OLD VERSION, KEPT FOR FALLBACK
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

    // Stream text character by character
    let currentText = '';
    const words = content.split(' ');

    for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        contentDiv.innerHTML = marked.parse(currentText) + '<span class="cursor">▋</span>';
        scrollToBottom();
        await sleep(30 + Math.random() * 40);
    }

    // Remove cursor and render final
    contentDiv.innerHTML = marked.parse(content);

    // Add copy buttons to code blocks
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

    // Add action buttons
    addMessageActions(messageDiv);

    scrollToBottom();
    saveMessageToChat('ai', content);

    // Reset send button
    isGenerating = false;
    sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `;
    messageInput.focus();
}

// Add message action buttons
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

// Action button handlers
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

// Typing Indicator
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'message ai';

    // Check if current model has thinking capability
    const hasThinking = MODELS[currentModel]?.hasThinking;

    // For thinking models - simple "Думаю..." without animation
    if (hasThinking) {
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="BreadixWebSite.png" alt="AI">
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
        // For non-thinking models - contextual phrases with animation
        const thinkingPhrase = getContextualThinkingPhrase();
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="BreadixWebSite.png" alt="AI">
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

    // Animate thinking phrases only for non-thinking models
    if (!hasThinking) {
        startThinkingAnimation(typingId);
    }

    return typingId;
}

// Get contextual thinking phrase based on last user message
function getContextualThinkingPhrase() {
    const chat = chatHistory.find(c => c.id === currentChatId);
    const lastMessage = chat?.messages[chat.messages.length - 1]?.content.toLowerCase() || '';

    // Search-related
    if (searchEnabled || lastMessage.includes('найди') || lastMessage.includes('поищи') || lastMessage.includes('найти')) {
        return 'Ищу информацию...';
    }

    // Code-related
    if (lastMessage.includes('код') || lastMessage.includes('функци') || lastMessage.includes('программ') ||
        lastMessage.includes('script') || lastMessage.includes('python') || lastMessage.includes('javascript')) {
        return 'Анализирую код...';
    }

    // File-related
    if (attachedFiles.length > 0) {
        return 'Читаю файлы...';
    }

    // Explanation-related
    if (lastMessage.includes('объясни') || lastMessage.includes('расскажи') || lastMessage.includes('что такое')) {
        return 'Формирую объяснение...';
    }

    // Translation-related
    if (lastMessage.includes('перевед') || lastMessage.includes('translate')) {
        return 'Перевожу текст...';
    }

    // Writing-related
    if (lastMessage.includes('напиши') || lastMessage.includes('создай') || lastMessage.includes('сгенерируй')) {
        return 'Создаю текст...';
    }

    // Analysis-related
    if (lastMessage.includes('проанализируй') || lastMessage.includes('сравни') || lastMessage.includes('оцени')) {
        return 'Анализирую данные...';
    }

    // Default phrases
    const defaultPhrases = [
        'Обрабатываю запрос...',
        'Формирую ответ...',
        'Анализирую вопрос...',
        'Подбираю информацию...'
    ];

    return defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
}

// Animate thinking phrases
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

    // Store interval ID to clear it later
    typingDiv.dataset.thinkingInterval = interval;
}

function removeTypingIndicator(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) {
        // Clear thinking animation interval
        if (typingDiv.dataset.thinkingInterval) {
            clearInterval(parseInt(typingDiv.dataset.thinkingInterval));
        }
        typingDiv.remove();
    }
}

// Call Real AI API
async function callAIModel(userMessage, files = null) {
    const chat = chatHistory.find(c => c.id === currentChatId);
    const messages = [];

    // Add system prompt for current model
    const systemPrompt = MODEL_PROMPTS[currentModel] || `Ты полезный AI-ассистент. Сегодня ${new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}.`;

    messages.push({
        role: 'system',
        content: systemPrompt
    });

    // If search is enabled, perform web search first
    let searchResults = '';
    if (searchEnabled) {
        try {
            searchResults = await performWebSearch(userMessage);
            if (searchResults) {
                messages.push({
                    role: 'system',
                    content: `Результаты поиска в интернете:\n\n${searchResults}\n\nИспользуй эту информацию для ответа на вопрос пользователя.`
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            showToast('Ошибка поиска, отвечаю без интернета', 'error');
        }
    }

    // Add chat history for context
    if (chat && chat.messages) {
        chat.messages.forEach(msg => {
            messages.push({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            });
        });
    }

    // Add current user message with images if present
    const hasVision = MODELS[currentModel]?.hasVision;
    if (files && files.length > 0 && hasVision) {
        // Multimodal format for vision models
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
        // Text-only format
        messages.push({
            role: 'user',
            content: userMessage
        });
    }

    try {
        const requestBody = {
            model: currentModel,
            messages: messages,
            stream: true,
            temperature: 0.7
        };

        // Use backend proxy instead of direct API call
        const response = await fetch(API_CONFIG.chatUrl, {
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

// Perform web search using Tavily API
async function performWebSearch(query) {
    try {
        // Use backend proxy for search
        const response = await fetch(API_CONFIG.searchUrl, {
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

        // Format search results
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

// New Chat
function createNewChat() {
    currentChatId = null;
    messagesContainer.innerHTML = '';
    messagesContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    messageInput.value = '';
    sendBtn.disabled = true;
    messageInput.focus();

    // Reset tokens for current model
    modelTokens[currentModel] = 0;
    updateTokenCounter();
    saveModelTokens();

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });

    saveCurrentChatId();
    showToast('Новый чат создан', 'plus');
}

// Chat History Management
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

// Context Menu
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

window.renameChat = function(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    const newTitle = prompt('Переименовать чат:', chat.title);
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        saveChatHistory();
        updateChatHistory();
    }
    closeContextMenu();
};

window.deleteChat = function(chatId) {
    if (!confirm('Удалить этот чат?')) return;

    chatHistory = chatHistory.filter(c => c.id !== chatId);
    if (currentChatId === chatId) {
        createNewChat();
    }
    saveChatHistory();
    updateChatHistory();
    closeContextMenu();
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
                    <img src="BreadixWebSite.png" alt="AI">
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

// Save to Chat
function saveMessageToChat(role, content) {
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.push({ role, content });
        saveChatHistory();
        updateTokenCounter();
    }
}

// LocalStorage
function saveChatHistory() {
    localStorage.setItem('breadixai_chats', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const saved = localStorage.getItem('breadixai_chats');
    if (saved) {
        chatHistory = JSON.parse(saved);
        updateChatHistory();
    }
}

// Save current chat ID
function saveCurrentChatId() {
    if (currentChatId) {
        localStorage.setItem('breadixai_current_chat', currentChatId);
    } else {
        localStorage.removeItem('breadixai_current_chat');
    }
}

// Load current chat ID and restore session
function loadCurrentChatId() {
    const savedChatId = localStorage.getItem('breadixai_current_chat');
    if (savedChatId && chatHistory.length > 0) {
        const chat = chatHistory.find(c => c.id === savedChatId);
        if (chat) {
            loadChat(savedChatId);
        }
    }
}

// Save search state
function saveSearchState() {
    localStorage.setItem('breadixai_search_enabled', searchEnabled.toString());
}

// Load search state
function loadSearchState() {
    const saved = localStorage.getItem('breadixai_search_enabled');
    if (saved === 'true') {
        searchEnabled = true;
        searchBtn.classList.add('active');
    }
}

// Save model tokens
function saveModelTokens() {
    localStorage.setItem('breadixai_model_tokens', JSON.stringify(modelTokens));
}

// Load model tokens
function loadModelTokens() {
    const saved = localStorage.getItem('breadixai_model_tokens');
    if (saved) {
        try {
            modelTokens = JSON.parse(saved);
        } catch (e) {
            modelTokens = {};
        }
    }
}

// Load search state
function loadSearchState() {
    const saved = localStorage.getItem('breadixai_search_enabled');
    if (saved === 'true') {
        searchEnabled = true;
        searchBtn.classList.add('active');
    }
}

// Utility
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

// Toast Notifications
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

// Load model from localStorage
function loadSelectedModel() {
    const saved = localStorage.getItem('breadixai_model');
    if (saved && MODELS[saved]) {
        currentModel = saved;
    }
}

// Save model to localStorage
function saveSelectedModel() {
    localStorage.setItem('breadixai_model', currentModel);
}

// Select model
function selectModel(modelId) {
    currentModel = modelId;
    saveSelectedModel();
    updateModelDisplay();
    updateTokenCounter(); // Update token counter for new model
    closeModelDropdownInline();

    const modelName = getModelName(modelId);
    showToast(`Модель изменена: ${modelName}`, 'check');

    // Update active state in dropdown
    document.querySelectorAll('.model-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.model-option').classList.add('active');
}

// Update model display
function updateModelDisplay() {
    if (currentModelNameInline) {
        currentModelNameInline.textContent = getModelName(currentModel);
    }
}

// Create inline model dropdown
function createModelDropdownInline() {
    const dropdown = document.createElement('div');
    dropdown.className = 'model-dropdown-inline';
    dropdown.id = 'modelDropdownInline';

    const categories = {
        'openai': 'OpenAI',
        'llama': 'Meta Llama',
        'qwen': 'Qwen',
        'other': 'Другие модели'
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

// Toggle inline model dropdown
function toggleModelDropdownInline() {
    const dropdown = document.getElementById('modelDropdownInline');
    const button = document.getElementById('modelSelectorInlineBtn');

    dropdown.classList.toggle('show');
    button.classList.toggle('open');
}

// Close inline model dropdown
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

// Handle file selection
async function handleFileSelect(event) {
    const files = Array.from(event.target.files);

    for (const file of files) {
        // Check file size (max 10MB)
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

// Read file content
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Check if image
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
            // Text file
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

// Update attached files display
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

// Remove attached file
window.removeAttachedFile = function(index) {
    attachedFiles.splice(index, 1);
    updateAttachedFilesDisplay();
    showToast('Файл удален', 'check');
};

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// User Menu & Settings - Initialize after DOM loaded
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
    const themeSelect = document.getElementById('themeSelect');
    const accountUsername = document.getElementById('accountUsername');
    const logoutBtnMenu = document.getElementById('logoutBtn');

    if (!userMenuBtn || !userMenuPopup) return;

    // Load username
    const currentUser = localStorage.getItem('breadixai_current_user') || 'Пользователь';
    userName.textContent = currentUser;
    accountUsername.textContent = currentUser;

    // Toggle user menu
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuPopup.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userMenuPopup.contains(e.target)) {
            userMenuPopup.classList.remove('active');
        }
    });

    // Open settings modal
    openSettingsBtn.addEventListener('click', () => {
        userMenuPopup.classList.remove('active');
        settingsModal.classList.add('active');

        // Load current theme
        const savedTheme = localStorage.getItem('breadixai_theme') || 'dark';
        themeSelect.value = savedTheme;
    });

    // Close settings modal
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Settings navigation
    settingsNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');

            // Update active nav item
            settingsNavItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active tab
            settingsTabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });

    // Theme change
    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        localStorage.setItem('breadixai_theme', theme);
        showToast('Тема изменена', 'check');
    });

    // Help button
    helpBtn.addEventListener('click', () => {
        userMenuPopup.classList.remove('active');
        showToast('Справка в разработке', 'info');
    });

    // Logout button
    if (logoutBtnMenu) {
        logoutBtnMenu.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                localStorage.removeItem('breadixai_logged_in');
                localStorage.removeItem('breadixai_current_user');
                window.location.href = 'sign_in.html';
            }
        });
    }
}

// Token counting functions
function estimateTokens(text) {
    if (!text) return 0;
    // Approximate: 1 token ≈ 4 characters for Russian/mixed text
    // For English it's closer to 0.75 words, but we use character-based for simplicity
    return Math.ceil(text.length / 4);
}

function calculateChatTokens() {
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat || !chat.messages) return 0;

    let total = 0;
    chat.messages.forEach(msg => {
        total += estimateTokens(msg.content);
        // Add tokens for attached files
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

        // Update color based on usage
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

        // Add handler for new chat button
        const newChatBtn = document.getElementById('newChatFromLimit');
        if (newChatBtn) {
            newChatBtn.onclick = () => {
                modal.classList.remove('active');
                createNewChat();
            };
        }
    }
}
