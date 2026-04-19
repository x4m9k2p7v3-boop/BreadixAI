// Crypto Utils - Улучшенное хеширование с Web Crypto API
// Использует SHA-256 + PBKDF2 для безопасного хранения паролей

class CryptoUtils {
    constructor() {
        this.PBKDF2_ITERATIONS = 100000; // 100,000 итераций
        this.SALT_LENGTH = 16; // 16 байт = 128 бит
        this.HASH_LENGTH = 32; // 32 байта = 256 бит
    }

    // Проверка поддержки Web Crypto API
    isSupported() {
        return window.crypto && window.crypto.subtle;
    }

    // Генерация случайной соли
    generateSalt() {
        const salt = new Uint8Array(this.SALT_LENGTH);
        window.crypto.getRandomValues(salt);
        return this.arrayBufferToHex(salt);
    }

    // Конвертация ArrayBuffer в hex строку
    arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Конвертация hex строки в ArrayBuffer
    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    // Хеширование пароля с PBKDF2
    async hashPassword(password, salt = null) {
        if (!this.isSupported()) {
            console.warn('Web Crypto API not supported, using fallback');
            return this.fallbackHash(password, salt);
        }

        try {
            // Генерируем соль если не передана
            if (!salt) {
                salt = this.generateSalt();
            }

            // Конвертируем пароль в ArrayBuffer
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            // Импортируем пароль как ключ
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );

            // Конвертируем соль в ArrayBuffer
            const saltBuffer = this.hexToArrayBuffer(salt);

            // Выполняем PBKDF2
            const hashBuffer = await window.crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: this.PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                },
                keyMaterial,
                this.HASH_LENGTH * 8 // в битах
            );

            const hash = this.arrayBufferToHex(hashBuffer);

            return {
                hash,
                salt,
                algorithm: 'PBKDF2-SHA256',
                iterations: this.PBKDF2_ITERATIONS
            };
        } catch (error) {
            console.error('Hashing error:', error);
            return this.fallbackHash(password, salt);
        }
    }

    // Проверка пароля
    async verifyPassword(password, storedHash, storedSalt) {
        if (!storedHash || !storedSalt) {
            return false;
        }

        // Если это старый формат хеша (без соли), используем старую функцию
        if (typeof storedHash === 'string' && !storedSalt) {
            return this.verifyLegacyPassword(password, storedHash);
        }

        try {
            const result = await this.hashPassword(password, storedSalt);
            return result.hash === storedHash;
        } catch (error) {
            console.error('Verification error:', error);
            return false;
        }
    }

    // Fallback хеширование (если Web Crypto API недоступен)
    fallbackHash(password, salt = null) {
        if (!salt) {
            salt = Math.random().toString(36).substring(2, 15);
        }

        let hash = 0;
        const combined = password + salt + 'breadixai_2026';

        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return {
            hash: hash.toString(36),
            salt,
            algorithm: 'fallback',
            iterations: 1
        };
    }

    // Проверка старого формата пароля (для миграции)
    verifyLegacyPassword(password, legacyHash) {
        const salt = 'breadixai_salt_2026';
        const combined = password + salt;
        let hash = 0;

        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return hash.toString(36) === legacyHash;
    }

    // Миграция старого пароля на новый формат
    async migratePassword(password, oldHash) {
        // Проверяем старый пароль
        if (!this.verifyLegacyPassword(password, oldHash)) {
            return null;
        }

        // Создаем новый хеш
        return await this.hashPassword(password);
    }

    // Генерация случайного токена
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return this.arrayBufferToHex(array);
    }

    // Хеширование строки (для контрольных вопросов и т.д.)
    async hashString(str) {
        if (!this.isSupported()) {
            return this.simpleHash(str);
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str.toLowerCase().trim());
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            return this.arrayBufferToHex(hashBuffer);
        } catch (error) {
            console.error('String hashing error:', error);
            return this.simpleHash(str);
        }
    }

    // Простое хеширование строки (fallback)
    simpleHash(str) {
        let hash = 0;
        const normalized = str.toLowerCase().trim();

        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return hash.toString(36);
    }

    // Проверка надежности пароля
    checkPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            longLength: password.length >= 12,
            veryLongLength: password.length >= 16,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            noCommon: !this.isCommonPassword(password)
        };

        // Подсчет баллов
        if (checks.length) strength++;
        if (checks.longLength) strength++;
        if (checks.veryLongLength) strength++;
        if (checks.lowercase) strength++;
        if (checks.uppercase) strength++;
        if (checks.numbers) strength++;
        if (checks.special) strength++;
        if (checks.noCommon) strength++;

        // Определение уровня
        let level, text, color;
        if (strength <= 3) {
            level = 'weak';
            text = 'Слабый';
            color = '#ef4444';
        } else if (strength <= 5) {
            level = 'medium';
            text = 'Средний';
            color = '#f59e0b';
        } else if (strength <= 7) {
            level = 'strong';
            text = 'Сильный';
            color = '#10b981';
        } else {
            level = 'very-strong';
            text = 'Очень сильный';
            color = '#059669';
        }

        return {
            level,
            text,
            color,
            strength,
            checks
        };
    }

    // Проверка на распространенные пароли
    isCommonPassword(password) {
        const common = [
            'password', 'password1', 'password123', '12345678', '123456789',
            'qwerty', 'qwerty123', 'admin', 'admin123', 'welcome',
            'welcome1', 'letmein', 'monkey', 'dragon', 'master',
            'sunshine', 'princess', 'football', 'iloveyou', 'trustno1'
        ];

        return common.some(weak =>
            password.toLowerCase().includes(weak.toLowerCase())
        );
    }
}

// Глобальный экземпляр
const cryptoUtils = new CryptoUtils();

// Экспорт
window.cryptoUtils = cryptoUtils;
