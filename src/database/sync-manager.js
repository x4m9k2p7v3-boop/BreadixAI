// Sync Manager - Синхронизация данных между вкладками браузера
// Использует BroadcastChannel API для real-time обновлений

class SyncManager {
    constructor() {
        this.channel = null;
        this.channelName = 'breadixai_sync';
        this.listeners = new Map();
        this.isInitialized = false;
        this.tabId = this.generateTabId();
    }

    // Генерация уникального ID вкладки
    generateTabId() {
        return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Инициализация канала синхронизации
    init() {
        if (this.isInitialized) return;

        // Проверка поддержки BroadcastChannel
        if (!window.BroadcastChannel) {
            console.warn('⚠️ BroadcastChannel not supported, sync disabled');
            return;
        }

        try {
            this.channel = new BroadcastChannel(this.channelName);

            this.channel.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.channel.onerror = (error) => {
                console.error('Sync channel error:', error);
            };

            this.isInitialized = true;
            console.log('✅ Sync Manager initialized, tab:', this.tabId);

            // Уведомляем другие вкладки о новой вкладке
            this.broadcast('tab_opened', { tabId: this.tabId });
        } catch (error) {
            console.error('Failed to initialize sync:', error);
        }
    }

    // Отправка сообщения в другие вкладки
    broadcast(type, data = {}) {
        if (!this.channel) return;

        const message = {
            type,
            data,
            tabId: this.tabId,
            timestamp: new Date().toISOString()
        };

        try {
            this.channel.postMessage(message);
        } catch (error) {
            console.error('Broadcast error:', error);
        }
    }

    // Обработка входящих сообщений
    handleMessage(message) {
        // Игнорируем свои собственные сообщения
        if (message.tabId === this.tabId) return;

        const { type, data } = message;

        // Вызываем зарегистрированные обработчики
        const handlers = this.listeners.get(type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data, message.tabId);
                } catch (error) {
                    console.error(`Error in sync handler for ${type}:`, error);
                }
            });
        }

        // Встроенные обработчики
        switch (type) {
            case 'tab_opened':
                console.log('📂 New tab opened:', data.tabId);
                break;

            case 'tab_closed':
                console.log('📂 Tab closed:', data.tabId);
                break;

            case 'chat_created':
                this.handleChatCreated(data);
                break;

            case 'chat_updated':
                this.handleChatUpdated(data);
                break;

            case 'chat_deleted':
                this.handleChatDeleted(data);
                break;

            case 'message_sent':
                this.handleMessageSent(data);
                break;

            case 'user_logged_in':
                this.handleUserLoggedIn(data);
                break;

            case 'user_logged_out':
                this.handleUserLoggedOut(data);
                break;

            case 'settings_changed':
                this.handleSettingsChanged(data);
                break;

            case 'model_changed':
                this.handleModelChanged(data);
                break;
        }
    }

    // Регистрация обработчика событий
    on(type, handler) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(handler);
    }

    // Удаление обработчика
    off(type, handler) {
        const handlers = this.listeners.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // === Встроенные обработчики ===

    async handleChatCreated(data) {
        console.log('🔄 Chat created in another tab:', data.chatId);

        // Перезагружаем историю чатов
        if (typeof loadChatHistory === 'function') {
            await loadChatHistory();
        }

        // Показываем уведомление
        if (typeof showToast === 'function') {
            showToast('Создан новый чат в другой вкладке', 'info');
        }
    }

    async handleChatUpdated(data) {
        console.log('🔄 Chat updated in another tab:', data.chatId);

        // Если это текущий открытый чат, перезагружаем его
        if (window.currentChatId === data.chatId) {
            await loadChatHistory();

            // Перезагружаем сообщения текущего чата
            if (typeof loadChat === 'function') {
                loadChat(data.chatId);
            }
        } else {
            // Просто обновляем список чатов
            await loadChatHistory();
        }
    }

    async handleChatDeleted(data) {
        console.log('🔄 Chat deleted in another tab:', data.chatId);

        // Если удален текущий чат, создаем новый
        if (window.currentChatId === data.chatId) {
            if (typeof createNewChat === 'function') {
                createNewChat();
            }
        }

        // Обновляем список чатов
        await loadChatHistory();

        if (typeof showToast === 'function') {
            showToast('Чат удален в другой вкладке', 'info');
        }
    }

    async handleMessageSent(data) {
        console.log('🔄 Message sent in another tab');

        // Если это текущий чат, добавляем сообщение
        if (window.currentChatId === data.chatId) {
            await loadChatHistory();

            if (typeof loadChat === 'function') {
                loadChat(data.chatId);
            }
        }
    }

    handleUserLoggedIn(data) {
        console.log('🔄 User logged in another tab:', data.username);

        // Перезагружаем страницу для синхронизации
        if (typeof showToast === 'function') {
            showToast('Вход выполнен в другой вкладке', 'info');
        }

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    handleUserLoggedOut(data) {
        console.log('🔄 User logged out in another tab');

        if (typeof showToast === 'function') {
            showToast('Выход выполнен в другой вкладке', 'info');
        }

        // Перенаправляем на страницу входа
        setTimeout(() => {
            window.location.href = 'sign_in.html';
        }, 1000);
    }

    async handleSettingsChanged(data) {
        console.log('🔄 Settings changed in another tab');

        // Перезагружаем настройки
        if (typeof loadSearchState === 'function') {
            loadSearchState();
        }

        if (typeof loadSelectedModel === 'function') {
            loadSelectedModel();
        }

        if (typeof showToast === 'function') {
            showToast('Настройки обновлены', 'info');
        }
    }

    handleModelChanged(data) {
        console.log('🔄 Model changed in another tab:', data.model);

        // Обновляем текущую модель
        if (window.currentModel !== data.model) {
            window.currentModel = data.model;

            if (typeof updateModelDisplay === 'function') {
                updateModelDisplay();
            }
        }
    }

    // === Публичные методы для отправки событий ===

    notifyChatCreated(chatId, title) {
        this.broadcast('chat_created', { chatId, title });
    }

    notifyChatUpdated(chatId) {
        this.broadcast('chat_updated', { chatId });
    }

    notifyChatDeleted(chatId) {
        this.broadcast('chat_deleted', { chatId });
    }

    notifyMessageSent(chatId, messageId) {
        this.broadcast('message_sent', { chatId, messageId });
    }

    notifyUserLoggedIn(username) {
        this.broadcast('user_logged_in', { username });
    }

    notifyUserLoggedOut() {
        this.broadcast('user_logged_out', {});
    }

    notifySettingsChanged(settings) {
        this.broadcast('settings_changed', settings);
    }

    notifyModelChanged(model) {
        this.broadcast('model_changed', { model });
    }

    // Закрытие канала
    close() {
        if (this.channel) {
            this.broadcast('tab_closed', { tabId: this.tabId });
            this.channel.close();
            this.channel = null;
            this.isInitialized = false;
            console.log('Sync channel closed');
        }
    }
}

// Глобальный экземпляр
const syncManager = new SyncManager();

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        syncManager.init();
    });
} else {
    syncManager.init();
}

// Уведомление о закрытии вкладки
window.addEventListener('beforeunload', () => {
    syncManager.close();
});

// Экспорт
window.syncManager = syncManager;
