// Validation functions
function validateUsername(username) {
    const errors = [];

    if (username.length < 3) {
        errors.push('Логин должен содержать минимум 3 символа');
    }

    if (username.length > 20) {
        errors.push('Логин не должен превышать 20 символов');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Логин может содержать только латинские буквы, цифры, дефис и подчёркивание');
    }

    if (/^\d/.test(username)) {
        errors.push('Логин не может начинаться с цифры');
    }

    return errors;
}

function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('Пароль должен содержать минимум 8 символов');
    }

    if (password.length > 64) {
        errors.push('Пароль не должен превышать 64 символа');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Пароль должен содержать хотя бы одну строчную букву');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Пароль должен содержать хотя бы одну заглавную букву');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Пароль должен содержать хотя бы одну цифру');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Пароль должен содержать хотя бы один специальный символ (!@#$%^&* и т.д.)');
    }

    // Check for common weak passwords
    const weakPasswords = [
        'password', 'Password1!', '12345678', 'Qwerty123!',
        'Admin123!', 'Welcome1!', 'Passw0rd!', 'Test1234!'
    ];

    if (weakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
        errors.push('Пароль слишком простой, используйте более сложную комбинацию');
    }

    return errors;
}

function getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    if (password.length >= 16) strength++;

    if (strength <= 2) return { level: 'weak', text: 'Слабый', color: '#ef4444' };
    if (strength <= 4) return { level: 'medium', text: 'Средний', color: '#f59e0b' };
    if (strength <= 6) return { level: 'strong', text: 'Сильный', color: '#10b981' };
    return { level: 'very-strong', text: 'Очень сильный', color: '#059669' };
}

// Simple hash function
function hashPassword(password) {
    let hash = 0;
    const salt = 'breadixai_salt_2026';
    const combined = password + salt;

    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return hash.toString(36);
}

// Rate limiting
const loginAttempts = {};

function checkRateLimit(username) {
    const now = Date.now();
    const attempts = loginAttempts[username] || [];

    // Remove attempts older than 15 minutes
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);

    if (recentAttempts.length >= 5) {
        const oldestAttempt = recentAttempts[0];
        const timeLeft = Math.ceil((15 * 60 * 1000 - (now - oldestAttempt)) / 1000 / 60);
        return { allowed: false, timeLeft };
    }

    return { allowed: true };
}

function recordLoginAttempt(username) {
    if (!loginAttempts[username]) {
        loginAttempts[username] = [];
    }
    loginAttempts[username].push(Date.now());
}

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for database to initialize
    await stableDB.init();

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const svg = togglePassword.querySelector('svg');
            if (type === 'text') {
                svg.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                svg.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    }

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);

            const svg = toggleConfirmPassword.querySelector('svg');
            if (type === 'text') {
                svg.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                svg.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    }

    // Sign In Form
    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const terms = document.getElementById('terms').checked;

            if (!terms) {
                NotificationSystem.alert('Пожалуйста, примите условия использования', 'warning');
                return;
            }

            // Check rate limit
            const rateLimit = checkRateLimit(username);
            if (!rateLimit.allowed) {
                NotificationSystem.alert(
                    `Слишком много попыток входа. Попробуйте снова через ${rateLimit.timeLeft} минут.`,
                    'error'
                );
                return;
            }

            // Get user from database
            const user = await stableDB.getUser(username);

            if (!user) {
                recordLoginAttempt(username);
                NotificationSystem.alert('Неверный логин или пароль', 'error');
                return;
            }

            // Проверка пароля (поддержка старого и нового формата)
            let isPasswordValid = false;

            if (user.salt && window.cryptoUtils) {
                // Новый формат с солью
                isPasswordValid = await cryptoUtils.verifyPassword(password, user.password, user.salt);
            } else {
                // Старый формат без соли
                const hashedPassword = hashPassword(password);
                isPasswordValid = (user.password === hashedPassword);

                // Миграция на новый формат при успешном входе
                if (isPasswordValid && window.cryptoUtils) {
                    const newHash = await cryptoUtils.hashPassword(password);
                    user.password = newHash.hash;
                    user.salt = newHash.salt;
                    user.hashAlgorithm = newHash.algorithm;
                    console.log('✅ Password migrated to new format');
                }
            }

            if (isPasswordValid) {
                // Successful login
                // Создаем сессию через session-manager
                if (window.sessionManager) {
                    await sessionManager.createSession(username);
                } else {
                    // Fallback на localStorage
                    localStorage.setItem('breadixai_logged_in', 'true');
                    localStorage.setItem('breadixai_current_user', username);
                }

                // Сохраняем текущего пользователя в БД настроек
                await stableDB.saveAppSetting('current_user', username);

                // Update last login in database
                user.lastLogin = new Date().toISOString();
                user.lastActivity = new Date().toISOString();
                await stableDB.saveUser(user);

                // Log activity
                await stableDB.logActivity(username, 'login');

                // Уведомляем другие вкладки
                if (window.syncManager) {
                    syncManager.notifyUserLoggedIn(username);
                }

                NotificationSystem.toast('Вход выполнен успешно', 'success', 2000);
                setTimeout(() => window.location.href = 'index.html', 500);
            } else {
                // Failed login
                recordLoginAttempt(username);
                NotificationSystem.alert('Неверный логин или пароль', 'error');
            }
        });
    }

    // Sign Up Form
    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        const passwordInput = document.getElementById('password');
        const usernameInput = document.getElementById('username');

        // Add password strength indicator
        if (passwordInput) {
            const strengthIndicator = document.createElement('div');
            strengthIndicator.className = 'password-strength';
            strengthIndicator.style.cssText = 'margin-top: 8px; font-size: 13px; display: none;';
            passwordInput.closest('.input-group').appendChild(strengthIndicator);

            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                if (password.length > 0) {
                    const strength = getPasswordStrength(password);
                    strengthIndicator.style.display = 'block';
                    strengthIndicator.style.color = strength.color;
                    strengthIndicator.textContent = `Надёжность пароля: ${strength.text}`;
                } else {
                    strengthIndicator.style.display = 'none';
                }
            });
        }

        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;
            const securityQuestion = document.getElementById('securityQuestion').value;
            const securityAnswer = document.getElementById('securityAnswer').value.trim();

            if (!terms) {
                NotificationSystem.alert('Пожалуйста, примите условия использования', 'warning');
                return;
            }

            if (!securityQuestion) {
                NotificationSystem.alert('Пожалуйста, выберите контрольный вопрос', 'warning');
                return;
            }

            if (!securityAnswer) {
                NotificationSystem.alert('Пожалуйста, введите ответ на контрольный вопрос', 'warning');
                return;
            }

            // Validate username
            const usernameErrors = validateUsername(username);
            if (usernameErrors.length > 0) {
                NotificationSystem.alert(usernameErrors.join('\n'), 'error');
                return;
            }

            // Validate password
            const passwordErrors = validatePassword(password);
            if (passwordErrors.length > 0) {
                NotificationSystem.alert(passwordErrors.join('\n'), 'error');
                return;
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                NotificationSystem.alert('Пароли не совпадают', 'error');
                return;
            }

            // Check if username already exists
            const existingUser = await stableDB.getUser(username);
            if (existingUser) {
                NotificationSystem.alert('Пользователь с таким логином уже существует', 'error');
                return;
            }

            // Hash password with new crypto utils
            let passwordHash, salt, algorithm;

            if (window.cryptoUtils) {
                const hashResult = await cryptoUtils.hashPassword(password);
                passwordHash = hashResult.hash;
                salt = hashResult.salt;
                algorithm = hashResult.algorithm;
            } else {
                // Fallback to old hashing
                passwordHash = hashPassword(password);
                salt = null;
                algorithm = 'legacy';
            }

            // Hash security answer
            let securityAnswerHash;
            if (window.cryptoUtils) {
                securityAnswerHash = await cryptoUtils.hashString(securityAnswer);
            } else {
                securityAnswerHash = PasswordRecovery.hashAnswer(securityAnswer);
            }

            const newUser = {
                username,
                password: passwordHash,
                salt: salt,
                hashAlgorithm: algorithm,
                securityQuestion,
                securityAnswer: securityAnswerHash,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                lastActivity: new Date().toISOString()
            };

            await stableDB.saveUser(newUser);

            // Log activity
            await stableDB.logActivity(username, 'registration');

            NotificationSystem.toast('Регистрация успешна! Перенаправление...', 'success', 2000);
            setTimeout(() => window.location.href = 'pages/sign_in.html', 1000);
        });
    }
});
