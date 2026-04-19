// Session Manager - Управление сессиями через IndexedDB
// Заменяет localStorage для безопасного хранения сессий

class SessionManager {
    constructor() {
        this.currentSession = null;
        this.SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 дней
        this.ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 минут
        this.activityTimer = null;
    }

    // Генерация UUID для session token
    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Получение информации об устройстве
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Создание новой сессии
    async createSession(username) {
        const sessionId = this.generateSessionId();
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();

        const session = {
            sessionId,
            username,
            createdAt: now,
            lastActivity: now,
            expiresAt,
            deviceInfo: this.getDeviceInfo(),
            isActive: true
        };

        // Сохраняем в IndexedDB
        await stableDB.safeWrite('sessions', session);

        // Сохраняем ID сессии в localStorage (только ID, не данные)
        localStorage.setItem('breadixai_session_id', sessionId);

        this.currentSession = session;
        this.startActivityTracking();

        console.log('✅ Session created:', sessionId);
        return session;
    }

    // Восстановление сессии при загрузке страницы
    async restoreSession() {
        const sessionId = localStorage.getItem('breadixai_session_id');

        if (!sessionId) {
            console.log('No session ID found');
            return null;
        }

        try {
            const session = await stableDB.read('sessions', sessionId);

            if (!session) {
                console.log('Session not found in database');
                this.clearSession();
                return null;
            }

            // Проверка срока действия
            const now = new Date();
            const expiresAt = new Date(session.expiresAt);

            if (now > expiresAt) {
                console.log('Session expired');
                await this.destroySession(sessionId);
                return null;
            }

            // Проверка активности (если не было активности > 30 дней)
            const lastActivity = new Date(session.lastActivity);
            const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);

            if (daysSinceActivity > 30) {
                console.log('Session inactive for too long');
                await this.destroySession(sessionId);
                return null;
            }

            // Обновляем lastActivity
            session.lastActivity = now.toISOString();
            await stableDB.safeWrite('sessions', session);

            this.currentSession = session;
            this.startActivityTracking();

            console.log('✅ Session restored:', sessionId);
            return session;
        } catch (error) {
            console.error('Error restoring session:', error);
            this.clearSession();
            return null;
        }
    }

    // Обновление активности сессии
    async updateActivity() {
        if (!this.currentSession) return;

        try {
            this.currentSession.lastActivity = new Date().toISOString();
            await stableDB.safeWrite('sessions', this.currentSession);
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    }

    // Автоматическое отслеживание активности
    startActivityTracking() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
        }

        // Обновляем активность каждые 5 минут
        this.activityTimer = setInterval(() => {
            this.updateActivity();
        }, this.ACTIVITY_CHECK_INTERVAL);

        // Обновляем при действиях пользователя
        const events = ['click', 'keypress', 'scroll', 'mousemove'];
        let lastUpdate = Date.now();

        const throttledUpdate = () => {
            const now = Date.now();
            // Обновляем не чаще раза в минуту
            if (now - lastUpdate > 60000) {
                this.updateActivity();
                lastUpdate = now;
            }
        };

        events.forEach(event => {
            document.addEventListener(event, throttledUpdate, { passive: true });
        });
    }

    // Продление сессии
    async extendSession() {
        if (!this.currentSession) return false;

        try {
            const newExpiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();
            this.currentSession.expiresAt = newExpiresAt;
            this.currentSession.lastActivity = new Date().toISOString();

            await stableDB.safeWrite('sessions', this.currentSession);

            console.log('✅ Session extended');
            return true;
        } catch (error) {
            console.error('Error extending session:', error);
            return false;
        }
    }

    // Уничтожение сессии (logout)
    async destroySession(sessionId = null) {
        const idToDestroy = sessionId || this.currentSession?.sessionId;

        if (!idToDestroy) return;

        try {
            await stableDB.delete('sessions', idToDestroy);

            if (this.activityTimer) {
                clearInterval(this.activityTimer);
                this.activityTimer = null;
            }

            this.currentSession = null;
            localStorage.removeItem('breadixai_session_id');

            console.log('✅ Session destroyed');
        } catch (error) {
            console.error('Error destroying session:', error);
        }
    }

    // Очистка локальных данных (без удаления из БД)
    clearSession() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }

        this.currentSession = null;
        localStorage.removeItem('breadixai_session_id');
    }

    // Получение всех активных сессий пользователя
    async getUserSessions(username) {
        try {
            const allSessions = await stableDB.readAll('sessions');
            return allSessions.filter(s => s.username === username && s.isActive);
        } catch (error) {
            console.error('Error getting user sessions:', error);
            return [];
        }
    }

    // Очистка истекших сессий (вызывать периодически)
    async cleanupExpiredSessions() {
        try {
            const allSessions = await stableDB.readAll('sessions');
            const now = new Date();
            let cleaned = 0;

            for (const session of allSessions) {
                const expiresAt = new Date(session.expiresAt);
                if (now > expiresAt) {
                    await stableDB.delete('sessions', session.sessionId);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} expired sessions`);
            }
        } catch (error) {
            console.error('Error cleaning expired sessions:', error);
        }
    }

    // Проверка авторизации
    isAuthenticated() {
        return this.currentSession !== null && this.currentSession.isActive;
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentSession?.username || null;
    }

    // Получение информации о сессии
    getSessionInfo() {
        if (!this.currentSession) return null;

        return {
            sessionId: this.currentSession.sessionId,
            username: this.currentSession.username,
            createdAt: this.currentSession.createdAt,
            lastActivity: this.currentSession.lastActivity,
            expiresAt: this.currentSession.expiresAt,
            deviceInfo: this.currentSession.deviceInfo
        };
    }
}

// Глобальный экземпляр
const sessionManager = new SessionManager();

// Автоматическая очистка истекших сессий раз в час
setInterval(() => {
    sessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Обновление активности перед закрытием страницы
window.addEventListener('beforeunload', () => {
    if (sessionManager.currentSession) {
        // Синхронный запрос для гарантии сохранения
        navigator.sendBeacon && sessionManager.updateActivity();
    }
});

// Экспорт
window.sessionManager = sessionManager;
