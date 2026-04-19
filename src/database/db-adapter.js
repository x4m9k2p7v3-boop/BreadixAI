// Database Adapter - заменяет localStorage на IndexedDB для чатов
// Этот файл делает миграцию прозрачной для существующего кода

class DatabaseAdapter {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        this.currentUser = localStorage.getItem('breadixai_current_user');
        await stableDB.init();
    }

    // Сохранить все чаты пользователя
    async saveChats(chats) {
        // Обновляем currentUser каждый раз
        this.currentUser = localStorage.getItem('breadixai_current_user');
        if (!this.currentUser) {
            console.warn('No current user, skipping save');
            return;
        }

        console.log(`Saving ${chats.length} chats for user: ${this.currentUser}`);

        // Сохраняем каждый чат в БД
        for (const chat of chats) {
            const chatData = {
                id: chat.id,
                username: this.currentUser,
                title: chat.title,
                model: chat.model,
                createdAt: chat.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await stableDB.saveChat(chatData);

            // Удаляем старые сообщения этого чата перед сохранением новых
            const existingMessages = await stableDB.getMessagesByChat(chat.id);

            // Сохраняем сообщения этого чата
            if (chat.messages && chat.messages.length > 0) {
                // Сохраняем только новые сообщения (которых нет в БД)
                for (const message of chat.messages) {
                    const messageData = {
                        id: message.id || `msg_${Date.now()}_${Math.random()}`,
                        chatId: chat.id,
                        role: message.role,
                        content: message.content,
                        timestamp: message.timestamp || new Date().toISOString()
                    };

                    // Проверяем есть ли уже такое сообщение
                    const exists = existingMessages.find(m =>
                        m.content === messageData.content &&
                        m.role === messageData.role &&
                        m.chatId === messageData.chatId
                    );

                    if (!exists) {
                        await stableDB.saveMessage(messageData);
                    }
                }
            }
        }

        console.log('✅ Chats saved successfully');
    }

    // Загрузить все чаты пользователя
    async loadChats() {
        // Обновляем currentUser каждый раз
        this.currentUser = localStorage.getItem('breadixai_current_user');
        if (!this.currentUser) {
            console.warn('No current user, returning empty chats');
            return [];
        }

        console.log(`Loading chats for user: ${this.currentUser}`);

        const chats = await stableDB.getChatsByUser(this.currentUser);

        // Загружаем сообщения для каждого чата
        for (const chat of chats) {
            const messages = await stableDB.getMessagesByChat(chat.id);
            chat.messages = messages;
        }

        console.log(`✅ Loaded ${chats.length} chats`);
        return chats;
    }

    // Удалить чат
    async deleteChat(chatId) {
        await stableDB.deleteChat(chatId);
    }

    // Сохранить текущий ID чата
    saveCurrentChatId(chatId) {
        localStorage.setItem('breadixai_current_chat', chatId);
    }

    // Загрузить текущий ID чата
    loadCurrentChatId() {
        return localStorage.getItem('breadixai_current_chat');
    }
}

// Глобальный экземпляр
const dbAdapter = new DatabaseAdapter();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    await dbAdapter.init();
});
