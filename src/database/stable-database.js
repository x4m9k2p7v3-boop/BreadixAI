// Stable Database Manager with Auto-save and Data Integrity
// Полная стабильная система сохранения всех данных

class StableDatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'BreadixAI_Stable';
        this.version = 3; // Обновлена версия для новых таблиц
        this.autoSaveInterval = null;
        this.pendingWrites = new Map();
        this.isInitialized = false;
    }

    // Инициализация с проверкой целостности
    async init() {
        if (this.isInitialized) {
            return true; // Already initialized
        }

        try {
            await this.openDatabase();
            await this.verifyDataIntegrity();
            this.startAutoSave();
            this.isInitialized = true;
            console.log('✅ Stable Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            await this.handleInitError(error);
            return false;
        }
    }

    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'username' });
                    usersStore.createIndex('email', 'email', { unique: false });
                    usersStore.createIndex('createdAt', 'createdAt', { unique: false });
                    usersStore.createIndex('lastLogin', 'lastLogin', { unique: false });
                }

                // Chats store
                if (!db.objectStoreNames.contains('chats')) {
                    const chatsStore = db.createObjectStore('chats', { keyPath: 'id' });
                    chatsStore.createIndex('username', 'username', { unique: false });
                    chatsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    chatsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // Messages store
                if (!db.objectStoreNames.contains('messages')) {
                    const messagesStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messagesStore.createIndex('chatId', 'chatId', { unique: false });
                    messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    messagesStore.createIndex('role', 'role', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'username' });
                }

                // Avatars store
                if (!db.objectStoreNames.contains('avatars')) {
                    const avatarsStore = db.createObjectStore('avatars', { keyPath: 'username' });
                }

                // Activity History store
                if (!db.objectStoreNames.contains('activity')) {
                    const activityStore = db.createObjectStore('activity', { keyPath: 'id', autoIncrement: true });
                    activityStore.createIndex('username', 'username', { unique: false });
                    activityStore.createIndex('timestamp', 'timestamp', { unique: false });
                    activityStore.createIndex('action', 'action', { unique: false });
                }

                // Favorites store
                if (!db.objectStoreNames.contains('favorites')) {
                    const favoritesStore = db.createObjectStore('favorites', { keyPath: 'id' });
                    favoritesStore.createIndex('username', 'username', { unique: false });
                    favoritesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Statistics store
                if (!db.objectStoreNames.contains('statistics')) {
                    const statsStore = db.createObjectStore('statistics', { keyPath: 'username' });
                }

                // Backup store - для резервных копий
                if (!db.objectStoreNames.contains('backups')) {
                    const backupsStore = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
                    backupsStore.createIndex('username', 'username', { unique: false });
                    backupsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Sessions store - для управления сессиями
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
                    sessionsStore.createIndex('username', 'username', { unique: false });
                    sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    sessionsStore.createIndex('lastActivity', 'lastActivity', { unique: false });
                    sessionsStore.createIndex('expiresAt', 'expiresAt', { unique: false });
                }

                // App Settings store - для настроек приложения (search, model, tokens)
                if (!db.objectStoreNames.contains('app_settings')) {
                    const appSettingsStore = db.createObjectStore('app_settings', { keyPath: 'key' });
                }

                console.log('Database schema created/updated to version', db.version);
            };
        });
    }

    // Проверка целостности данных
    async verifyDataIntegrity() {
        try {
            const stores = ['users', 'chats', 'messages', 'settings', 'avatars', 'activity', 'favorites', 'statistics', 'sessions', 'app_settings'];
            for (const storeName of stores) {
                const count = await this.countRecords(storeName);
                console.log(`✓ ${storeName}: ${count} records`);
            }
            return true;
        } catch (error) {
            console.error('Data integrity check failed:', error);
            return false;
        }
    }

    async countRecords(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Автосохранение каждые 30 секунд
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.pendingWrites.size > 0) {
                console.log(`Auto-saving ${this.pendingWrites.size} pending writes...`);
                await this.flushPendingWrites();
            }
        }, 30000); // 30 секунд
    }

    async flushPendingWrites() {
        const writes = Array.from(this.pendingWrites.values());
        this.pendingWrites.clear();

        for (const write of writes) {
            try {
                await write();
            } catch (error) {
                console.error('Failed to flush write:', error);
            }
        }
    }

    // Безопасная запись с повторными попытками
    async safeWrite(storeName, data, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await this.write(storeName, data);
            } catch (error) {
                console.warn(`Write attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error;
                await this.delay(100 * (i + 1)); // Exponential backoff
            }
        }
    }

    async write(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async read(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async readAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // === USERS ===
    async saveUser(userData) {
        userData.lastModified = new Date().toISOString();
        return await this.safeWrite('users', userData);
    }

    async getUser(username) {
        return await this.read('users', username);
    }

    async getAllUsers() {
        return await this.readAll('users');
    }

    async deleteUser(username) {
        return await this.delete('users', username);
    }

    // === CHATS ===
    async saveChat(chatData) {
        chatData.updatedAt = new Date().toISOString();
        chatData.lastModified = new Date().toISOString();
        return await this.safeWrite('chats', chatData);
    }

    async getChat(chatId) {
        return await this.read('chats', chatId);
    }

    async getChatsByUser(username) {
        if (!this.db) {
            console.error('Database not initialized');
            return [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['chats'], 'readonly');
            const store = transaction.objectStore('chats');
            const index = store.index('username');
            const request = index.getAll(username);

            request.onsuccess = () => {
                const chats = request.result.sort((a, b) =>
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );
                resolve(chats);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteChat(chatId) {
        // Delete chat and all its messages
        const transaction = this.db.transaction(['chats', 'messages'], 'readwrite');

        const chatsStore = transaction.objectStore('chats');
        chatsStore.delete(chatId);

        const messagesStore = transaction.objectStore('messages');
        const index = messagesStore.index('chatId');
        const request = index.openCursor(IDBKeyRange.only(chatId));

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // === MESSAGES ===
    async saveMessage(messageData) {
        if (!messageData.timestamp) {
            messageData.timestamp = new Date().toISOString();
        }
        return await this.safeWrite('messages', messageData);
    }

    async getMessagesByChat(chatId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('chatId');
            const request = index.getAll(chatId);

            request.onsuccess = () => {
                const messages = request.result.sort((a, b) =>
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                resolve(messages);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // === SETTINGS ===
    async saveSettings(username, settings) {
        settings.username = username;
        settings.lastModified = new Date().toISOString();
        return await this.safeWrite('settings', settings);
    }

    async getSettings(username) {
        const settings = await this.read('settings', username);
        return settings || {};
    }

    // === AVATARS ===
    async saveAvatar(username, avatarDataURL) {
        return await this.safeWrite('avatars', {
            username,
            avatar: avatarDataURL,
            lastModified: new Date().toISOString()
        });
    }

    async getAvatar(username) {
        const data = await this.read('avatars', username);
        return data?.avatar || null;
    }

    async deleteAvatar(username) {
        return await this.delete('avatars', username);
    }

    // === ACTIVITY ===
    async logActivity(username, action, details = {}) {
        return await this.safeWrite('activity', {
            username,
            action,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        });
    }

    async getActivityByUser(username, limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['activity'], 'readonly');
            const store = transaction.objectStore('activity');
            const index = store.index('username');
            const request = index.getAll(username);

            request.onsuccess = () => {
                const activities = request.result
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, limit);
                resolve(activities);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearActivityByUser(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['activity'], 'readwrite');
            const store = transaction.objectStore('activity');
            const index = store.index('username');
            const request = index.openCursor(IDBKeyRange.only(username));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // === FAVORITES ===
    async saveFavorite(username, messageId, content, model) {
        return await this.safeWrite('favorites', {
            id: messageId,
            username,
            content,
            model,
            timestamp: new Date().toISOString()
        });
    }

    async getFavoritesByUser(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['favorites'], 'readonly');
            const store = transaction.objectStore('favorites');
            const index = store.index('username');
            const request = index.getAll(username);

            request.onsuccess = () => {
                const favorites = request.result.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                resolve(favorites);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFavorite(messageId) {
        return await this.delete('favorites', messageId);
    }

    async isFavorite(messageId) {
        const fav = await this.read('favorites', messageId);
        return !!fav;
    }

    // === STATISTICS ===
    async saveStatistics(username, stats) {
        stats.username = username;
        stats.lastModified = new Date().toISOString();
        return await this.safeWrite('statistics', stats);
    }

    async getStatistics(username) {
        const stats = await this.read('statistics', username);
        return stats || { daily: {}, total: {} };
    }

    async recordUsage(username, model, tokensUsed) {
        const stats = await this.getStatistics(username);
        const today = new Date().toISOString().split('T')[0];

        if (!stats.daily) stats.daily = {};
        if (!stats.daily[today]) stats.daily[today] = {};
        if (!stats.daily[today][model]) stats.daily[today][model] = 0;
        stats.daily[today][model] += tokensUsed;

        if (!stats.total) stats.total = {};
        if (!stats.total[model]) stats.total[model] = 0;
        stats.total[model] += tokensUsed;

        return await this.saveStatistics(username, stats);
    }

    // === BACKUP ===
    async createBackup(username) {
        const [user, chats, settings, avatar, activity, favorites, statistics] = await Promise.all([
            this.getUser(username),
            this.getChatsByUser(username),
            this.getSettings(username),
            this.getAvatar(username),
            this.getActivityByUser(username),
            this.getFavoritesByUser(username),
            this.getStatistics(username)
        ]);

        const messages = {};
        for (const chat of chats) {
            messages[chat.id] = await this.getMessagesByChat(chat.id);
        }

        const backup = {
            username,
            timestamp: new Date().toISOString(),
            data: {
                user,
                chats,
                messages,
                settings,
                avatar,
                activity,
                favorites,
                statistics
            }
        };

        await this.safeWrite('backups', backup);
        console.log(`✅ Backup created for ${username}`);
        return backup;
    }

    async getBackups(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const index = store.index('username');
            const request = index.getAll(username);

            request.onsuccess = () => {
                const backups = request.result.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                resolve(backups);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async restoreFromBackup(backupId) {
        const backup = await this.read('backups', backupId);
        if (!backup) throw new Error('Backup not found');

        const { username, data } = backup;

        // Restore all data
        if (data.user) await this.saveUser(data.user);
        if (data.chats) {
            for (const chat of data.chats) {
                await this.saveChat(chat);
            }
        }
        if (data.messages) {
            for (const chatId in data.messages) {
                for (const message of data.messages[chatId]) {
                    await this.saveMessage(message);
                }
            }
        }
        if (data.settings) await this.saveSettings(username, data.settings);
        if (data.avatar) await this.saveAvatar(username, data.avatar);
        if (data.activity) {
            for (const activity of data.activity) {
                await this.logActivity(username, activity.action, activity.details);
            }
        }
        if (data.favorites) {
            for (const favorite of data.favorites) {
                await this.saveFavorite(username, favorite.id, favorite.content, favorite.model);
            }
        }
        if (data.statistics) await this.saveStatistics(username, data.statistics);

        console.log(`✅ Restored from backup for ${username}`);
        return true;
    }

    // === EXPORT/IMPORT ===
    async exportAllData(username) {
        return await this.createBackup(username);
    }

    async importAllData(importData) {
        const { username, data } = importData;

        if (data.user) await this.saveUser(data.user);
        if (data.chats) {
            for (const chat of data.chats) {
                await this.saveChat(chat);
            }
        }
        if (data.messages) {
            for (const chatId in data.messages) {
                for (const message of data.messages[chatId]) {
                    await this.saveMessage(message);
                }
            }
        }
        if (data.settings) await this.saveSettings(username, data.settings);
        if (data.avatar) await this.saveAvatar(username, data.avatar);
        if (data.activity) {
            for (const activity of data.activity) {
                await this.logActivity(username, activity.action, activity.details);
            }
        }
        if (data.favorites) {
            for (const favorite of data.favorites) {
                await this.saveFavorite(username, favorite.id, favorite.content, favorite.model);
            }
        }
        if (data.statistics) await this.saveStatistics(username, data.statistics);

        return true;
    }

    // === CLEANUP ===
    async deleteAllUserData(username) {
        await this.deleteUser(username);

        const chats = await this.getChatsByUser(username);
        for (const chat of chats) {
            await this.deleteChat(chat.id);
        }

        await this.delete('settings', username);
        await this.deleteAvatar(username);
        await this.clearActivityByUser(username);

        // Delete favorites
        const transaction = this.db.transaction(['favorites'], 'readwrite');
        const favStore = transaction.objectStore('favorites');
        const favIndex = favStore.index('username');
        const favRequest = favIndex.openCursor(IDBKeyRange.only(username));

        await new Promise((resolve) => {
            favRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
        });

        await this.delete('statistics', username);
    }

    // Обработка ошибок инициализации
    async handleInitError(error) {
        console.error('Attempting to recover from init error...');
        try {
            // Попытка пересоздать БД
            indexedDB.deleteDatabase(this.dbName);
            await this.delay(1000);
            await this.openDatabase();
            console.log('✅ Database recovered');
        } catch (recoveryError) {
            console.error('❌ Recovery failed:', recoveryError);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Очистка при выходе
    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.flushPendingWrites();
    }

    // === APP SETTINGS (замена localStorage) ===
    async saveAppSetting(key, value) {
        return await this.safeWrite('app_settings', {
            key,
            value,
            lastModified: new Date().toISOString()
        });
    }

    async getAppSetting(key, defaultValue = null) {
        const setting = await this.read('app_settings', key);
        return setting ? setting.value : defaultValue;
    }

    async deleteAppSetting(key) {
        return await this.delete('app_settings', key);
    }

    async getAllAppSettings() {
        return await this.readAll('app_settings');
    }

    // Миграция данных из localStorage в IndexedDB
    async migrateFromLocalStorage() {
        console.log('🔄 Migrating data from localStorage to IndexedDB...');

        const migrations = [
            { key: 'breadixai_search_enabled', dbKey: 'search_enabled' },
            { key: 'breadixai_model_tokens', dbKey: 'model_tokens' },
            { key: 'breadixai_current_user', dbKey: 'current_user' },
            { key: 'breadixai_current_chat', dbKey: 'current_chat' },
            { key: 'breadixai_selected_model', dbKey: 'selected_model' }
        ];

        let migrated = 0;

        for (const { key, dbKey } of migrations) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                try {
                    // Пытаемся распарсить JSON
                    let parsedValue;
                    try {
                        parsedValue = JSON.parse(value);
                    } catch {
                        parsedValue = value;
                    }

                    await this.saveAppSetting(dbKey, parsedValue);
                    migrated++;
                    console.log(`✓ Migrated ${key} → ${dbKey}`);
                } catch (error) {
                    console.error(`Failed to migrate ${key}:`, error);
                }
            }
        }

        if (migrated > 0) {
            console.log(`✅ Migrated ${migrated} settings from localStorage`);
        }

        return migrated;
    }
}

// Глобальный экземпляр
const stableDB = new StableDatabaseManager();

// Автосохранение перед закрытием страницы
window.addEventListener('beforeunload', () => {
    stableDB.cleanup();
});

// Экспорт для совместимости
window.breadixDB = stableDB;
