// XSS Protection - sanitize user input
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Remove potentially dangerous characters and scripts
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
}

// CAPTCHA System
class SimpleCaptcha {
    constructor() {
        this.answer = null;
    }

    generate() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let answer;
        switch(operator) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }

        this.answer = answer;
        return `${num1} ${operator} ${num2} = ?`;
    }

    verify(userAnswer) {
        return parseInt(userAnswer) === this.answer;
    }
}

// Password Recovery System
class PasswordRecovery {
    static async saveRecoveryData(username, securityQuestion, securityAnswer) {
        const user = await stableDB.getUser(username);

        if (user) {
            user.securityQuestion = securityQuestion;
            user.securityAnswer = this.hashAnswer(securityAnswer);
            await stableDB.saveUser(user);
            return true;
        }
        return false;
    }

    static hashAnswer(answer) {
        return answer.toLowerCase().trim().split('').reduce((hash, char) => {
            return ((hash << 5) - hash) + char.charCodeAt(0);
        }, 0).toString(36);
    }

    static async verifyAnswer(username, answer) {
        const user = await stableDB.getUser(username);

        if (user && user.securityAnswer) {
            return user.securityAnswer === this.hashAnswer(answer);
        }
        return false;
    }

    static async getSecurityQuestion(username) {
        const user = await stableDB.getUser(username);
        return user?.securityQuestion || null;
    }

    static async resetPassword(username, newPassword) {
        const user = await stableDB.getUser(username);

        if (user) {
            // Use the same hash function from auth.js
            user.password = hashPassword(newPassword);
            await stableDB.saveUser(user);
            return true;
        }
        return false;
    }
}

// Activity History - теперь использует IndexedDB
class ActivityHistory {
    static async log(username, action, details = {}) {
        await stableDB.logActivity(username, action, details);
    }

    static async get(username) {
        return await stableDB.getActivityByUser(username, 50);
    }

    static async clear(username) {
        await stableDB.clearActivityByUser(username);
    }
}

// User Avatar System - теперь использует IndexedDB
class AvatarManager {
    static async save(username, avatarDataURL) {
        await stableDB.saveAvatar(username, avatarDataURL);
    }

    static async get(username) {
        return await stableDB.getAvatar(username);
    }

    static async delete(username) {
        await stableDB.deleteAvatar(username);
    }

    static getInitials(username) {
        return username.substring(0, 2).toUpperCase();
    }
}

// Chat Export/Import - теперь использует IndexedDB
class ChatManager {
    static async exportChats() {
        const currentUser = localStorage.getItem('breadixai_current_user');
        if (!currentUser) return null;

        const exportData = await stableDB.exportAllData(currentUser);
        return JSON.stringify(exportData, null, 2);
    }

    static async importChats(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (!data.data || !data.username) {
                throw new Error('Invalid data format');
            }

            await stableDB.importAllData(data);
            return { success: true, imported: data.data.chats?.length || 0 };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static downloadAsFile(content, filename) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Favorites System - теперь использует IndexedDB
class FavoritesManager {
    static async add(messageId, content, model) {
        const currentUser = localStorage.getItem('breadixai_current_user');
        if (!currentUser) return;

        await stableDB.saveFavorite(currentUser, messageId, content, model);
    }

    static async remove(messageId) {
        await stableDB.deleteFavorite(messageId);
    }

    static async getAll() {
        const currentUser = localStorage.getItem('breadixai_current_user');
        if (!currentUser) return [];

        return await stableDB.getFavoritesByUser(currentUser);
    }

    static async isFavorite(messageId) {
        return await stableDB.isFavorite(messageId);
    }
}

// Usage Statistics - теперь использует IndexedDB
class UsageStats {
    static async record(model, tokensUsed) {
        const currentUser = localStorage.getItem('breadixai_current_user');
        if (!currentUser) return;

        await stableDB.recordUsage(currentUser, model, tokensUsed);
    }

    static async getStats() {
        const currentUser = localStorage.getItem('breadixai_current_user');
        if (!currentUser) return { daily: {}, total: {} };

        return await stableDB.getStatistics(currentUser);
    }

    static async getTotalTokens() {
        const stats = await this.getStats();
        if (!stats.total) return 0;
        return Object.values(stats.total).reduce((sum, val) => sum + val, 0);
    }

    static async getMostUsedModel() {
        const stats = await this.getStats();
        if (!stats.total) return null;

        let maxModel = null;
        let maxTokens = 0;

        for (const [model, tokens] of Object.entries(stats.total)) {
            if (tokens > maxTokens) {
                maxTokens = tokens;
                maxModel = model;
            }
        }

        return maxModel;
    }
}

// Voice Input
class VoiceInput {
    constructor() {
        this.recognition = null;
        this.isListening = false;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ru-RU';
        }
    }

    isSupported() {
        return this.recognition !== null;
    }

    start(onResult, onError, onStart) {
        if (!this.recognition || this.isListening) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (onStart) onStart();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Send both interim and final results
            onResult(finalTranscript || interimTranscript, event.results[event.results.length - 1].isFinal);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            onError(event.error);
            this.isListening = false;
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            this.isListening = false;
            onError(error);
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
}

// Keyboard Shortcuts
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = {
            'ctrl+k': () => this.openSearch(),
            'ctrl+n': () => this.newChat(),
            'ctrl+/': () => this.showHelp(),
            'ctrl+e': () => this.exportChats(),
            'ctrl+,': () => this.openSettings()
        };

        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyCombo(e);

            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key]();
            }
        });
    }

    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    openSearch() {
        // Will be implemented in main script
        if (window.openSearchModal) window.openSearchModal();
    }

    newChat() {
        if (window.createNewChat) window.createNewChat();
    }

    showHelp() {
        if (window.showKeyboardHelp) window.showKeyboardHelp();
    }

    exportChats() {
        if (window.exportChatsAction) window.exportChatsAction();
    }

    openSettings() {
        const settingsBtn = document.getElementById('openSettingsBtn');
        if (settingsBtn) settingsBtn.click();
    }
}

// Initialize on load
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        sanitizeInput,
        SimpleCaptcha,
        PasswordRecovery,
        ActivityHistory,
        AvatarManager,
        ChatManager,
        FavoritesManager,
        UsageStats,
        VoiceInput,
        KeyboardShortcuts
    };
}
