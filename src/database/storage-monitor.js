// Storage Monitor - Мониторинг хранилища IndexedDB
// Проверка квоты, предупреждения, автоочистка

class StorageMonitor {
    constructor() {
        this.quotaWarningThreshold = 0.8; // 80%
        this.quotaCriticalThreshold = 0.95; // 95%
        this.checkInterval = 5 * 60 * 1000; // 5 минут
        this.monitorTimer = null;
        this.lastCheck = null;
    }

    // Получение информации о квоте хранилища
    async getStorageInfo() {
        if (!navigator.storage || !navigator.storage.estimate) {
            console.warn('Storage API not supported');
            return null;
        }

        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const usagePercent = quota > 0 ? (usage / quota) : 0;

            return {
                usage,
                quota,
                usagePercent,
                usageMB: (usage / (1024 * 1024)).toFixed(2),
                quotaMB: (quota / (1024 * 1024)).toFixed(2),
                availableMB: ((quota - usage) / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    // Получение размера IndexedDB
    async getIndexedDBSize() {
        if (!window.indexedDB) {
            return { total: 0, databases: {} };
        }

        try {
            const databases = await window.indexedDB.databases();
            const sizes = {};
            let total = 0;

            for (const dbInfo of databases) {
                const size = await this.getDatabaseSize(dbInfo.name);
                sizes[dbInfo.name] = size;
                total += size;
            }

            return {
                total,
                totalMB: (total / (1024 * 1024)).toFixed(2),
                databases: sizes
            };
        } catch (error) {
            console.error('Error getting IndexedDB size:', error);
            return { total: 0, databases: {} };
        }
    }

    // Получение размера конкретной БД (приблизительно)
    async getDatabaseSize(dbName) {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(dbName);

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    let totalSize = 0;

                    const storeNames = Array.from(db.objectStoreNames);
                    let completed = 0;

                    if (storeNames.length === 0) {
                        db.close();
                        resolve(0);
                        return;
                    }

                    storeNames.forEach(storeName => {
                        const transaction = db.transaction([storeName], 'readonly');
                        const store = transaction.objectStore(storeName);
                        const request = store.getAll();

                        request.onsuccess = () => {
                            const data = request.result;
                            // Приблизительный подсчет размера
                            const size = JSON.stringify(data).length;
                            totalSize += size;

                            completed++;
                            if (completed === storeNames.length) {
                                db.close();
                                resolve(totalSize);
                            }
                        };

                        request.onerror = () => {
                            completed++;
                            if (completed === storeNames.length) {
                                db.close();
                                resolve(totalSize);
                            }
                        };
                    });
                };

                request.onerror = () => resolve(0);
            } catch (error) {
                resolve(0);
            }
        });
    }

    // Проверка состояния хранилища
    async checkStorage() {
        const info = await this.getStorageInfo();
        if (!info) return null;

        this.lastCheck = new Date().toISOString();

        const status = {
            ...info,
            level: 'ok',
            message: 'Хранилище в норме',
            needsCleanup: false
        };

        // Определение уровня заполненности
        if (info.usagePercent >= this.quotaCriticalThreshold) {
            status.level = 'critical';
            status.message = `Критически мало места! Использовано ${(info.usagePercent * 100).toFixed(1)}%`;
            status.needsCleanup = true;
        } else if (info.usagePercent >= this.quotaWarningThreshold) {
            status.level = 'warning';
            status.message = `Заканчивается место. Использовано ${(info.usagePercent * 100).toFixed(1)}%`;
            status.needsCleanup = true;
        }

        return status;
    }

    // Запуск мониторинга
    startMonitoring() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
        }

        // Первая проверка сразу
        this.performCheck();

        // Периодические проверки
        this.monitorTimer = setInterval(() => {
            this.performCheck();
        }, this.checkInterval);

        console.log('✅ Storage monitoring started');
    }

    // Выполнение проверки
    async performCheck() {
        const status = await this.checkStorage();
        if (!status) return;

        console.log(`💾 Storage: ${status.usageMB}MB / ${status.quotaMB}MB (${(status.usagePercent * 100).toFixed(1)}%)`);

        // Уведомления пользователя
        if (status.level === 'critical') {
            this.showStorageWarning(status, true);
        } else if (status.level === 'warning') {
            this.showStorageWarning(status, false);
        }

        // Автоматическая очистка при критическом уровне
        if (status.needsCleanup && status.level === 'critical') {
            await this.autoCleanup();
        }
    }

    // Показать предупреждение о хранилище
    showStorageWarning(status, isCritical) {
        if (typeof showToast === 'function') {
            showToast(status.message, isCritical ? 'error' : 'warning');
        }

        // Показываем модальное окно для критического уровня
        if (isCritical && typeof showModal === 'function') {
            showModal({
                title: '⚠️ Критически мало места',
                message: `Использовано ${status.usageMB}MB из ${status.quotaMB}MB. Рекомендуется очистить старые данные.`,
                buttons: [
                    {
                        text: 'Очистить сейчас',
                        primary: true,
                        action: () => this.showCleanupDialog()
                    },
                    {
                        text: 'Позже',
                        action: () => {}
                    }
                ]
            });
        }
    }

    // Диалог очистки данных
    showCleanupDialog() {
        if (typeof showModal === 'function') {
            showModal({
                title: '🧹 Очистка данных',
                message: 'Выберите что удалить:',
                buttons: [
                    {
                        text: 'Старые чаты (>30 дней)',
                        action: async () => {
                            await this.cleanOldChats(30);
                            showToast('Старые чаты удалены', 'check');
                        }
                    },
                    {
                        text: 'Историю активности',
                        action: async () => {
                            await this.cleanActivityHistory();
                            showToast('История активности очищена', 'check');
                        }
                    },
                    {
                        text: 'Старые бэкапы',
                        action: async () => {
                            await this.cleanOldBackups(7);
                            showToast('Старые бэкапы удалены', 'check');
                        }
                    },
                    {
                        text: 'Отмена',
                        action: () => {}
                    }
                ]
            });
        }
    }

    // Автоматическая очистка
    async autoCleanup() {
        console.log('🧹 Starting auto cleanup...');

        let cleaned = 0;

        // Удаляем старые бэкапы (оставляем последние 3)
        cleaned += await this.cleanOldBackups(3);

        // Удаляем старую историю активности (оставляем последние 100 записей)
        cleaned += await this.cleanActivityHistory(100);

        // Удаляем истекшие сессии
        if (window.sessionManager) {
            await sessionManager.cleanupExpiredSessions();
        }

        console.log(`✅ Auto cleanup completed, cleaned ${cleaned} items`);

        if (cleaned > 0 && typeof showToast === 'function') {
            showToast(`Автоматически очищено ${cleaned} записей`, 'check');
        }

        return cleaned;
    }

    // Очистка старых чатов
    async cleanOldChats(daysOld = 30) {
        if (!window.stableDB) return 0;

        try {
            const allChats = await stableDB.readAll('chats');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            let deleted = 0;

            for (const chat of allChats) {
                const chatDate = new Date(chat.updatedAt || chat.createdAt);
                if (chatDate < cutoffDate) {
                    await stableDB.deleteChat(chat.id);
                    deleted++;
                }
            }

            console.log(`🧹 Deleted ${deleted} old chats`);
            return deleted;
        } catch (error) {
            console.error('Error cleaning old chats:', error);
            return 0;
        }
    }

    // Очистка истории активности
    async cleanActivityHistory(keepLast = 50) {
        if (!window.stableDB) return 0;

        try {
            const currentUser = localStorage.getItem('breadixai_current_user');
            if (!currentUser) return 0;

            const activities = await stableDB.getActivityByUser(currentUser, 1000);

            if (activities.length <= keepLast) return 0;

            // Удаляем старые записи
            const toDelete = activities.slice(keepLast);
            let deleted = 0;

            for (const activity of toDelete) {
                await stableDB.delete('activity', activity.id);
                deleted++;
            }

            console.log(`🧹 Deleted ${deleted} activity records`);
            return deleted;
        } catch (error) {
            console.error('Error cleaning activity history:', error);
            return 0;
        }
    }

    // Очистка старых бэкапов
    async cleanOldBackups(keepLast = 7) {
        if (!window.stableDB) return 0;

        try {
            const currentUser = localStorage.getItem('breadixai_current_user');
            if (!currentUser) return 0;

            const backups = await stableDB.getBackups(currentUser);

            if (backups.length <= keepLast) return 0;

            // Удаляем старые бэкапы
            const toDelete = backups.slice(keepLast);
            let deleted = 0;

            for (const backup of toDelete) {
                await stableDB.delete('backups', backup.id);
                deleted++;
            }

            console.log(`🧹 Deleted ${deleted} old backups`);
            return deleted;
        } catch (error) {
            console.error('Error cleaning old backups:', error);
            return 0;
        }
    }

    // Получение детальной статистики
    async getDetailedStats() {
        const storageInfo = await this.getStorageInfo();
        const dbSize = await this.getIndexedDBSize();

        if (!window.stableDB) {
            return { storageInfo, dbSize };
        }

        try {
            const stats = {
                storageInfo,
                dbSize,
                records: {
                    users: await stableDB.countRecords('users'),
                    chats: await stableDB.countRecords('chats'),
                    messages: await stableDB.countRecords('messages'),
                    sessions: await stableDB.countRecords('sessions'),
                    activity: await stableDB.countRecords('activity'),
                    favorites: await stableDB.countRecords('favorites'),
                    backups: await stableDB.countRecords('backups')
                },
                lastCheck: this.lastCheck
            };

            return stats;
        } catch (error) {
            console.error('Error getting detailed stats:', error);
            return { storageInfo, dbSize };
        }
    }

    // Остановка мониторинга
    stopMonitoring() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
            console.log('Storage monitoring stopped');
        }
    }
}

// Глобальный экземпляр
const storageMonitor = new StorageMonitor();

// Автоматический запуск мониторинга
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        storageMonitor.startMonitoring();
    });
} else {
    storageMonitor.startMonitoring();
}

// Экспорт
window.storageMonitor = storageMonitor;
