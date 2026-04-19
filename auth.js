// Theme Toggle
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');

    function updateThemeIcon(isDark) {
        if (!themeToggle) return;
        const svg = themeToggle.querySelector('svg');
        if (isDark) {
            svg.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            `;
        } else {
            svg.innerHTML = `
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            `;
        }
    }

    // Load theme - default to dark
    const savedTheme = localStorage.getItem('breadixai_auth_theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        updateThemeIcon(false);
    } else {
        // Dark theme by default
        document.body.classList.add('dark-theme');
        localStorage.setItem('breadixai_auth_theme', 'dark');
        updateThemeIcon(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('breadixai_auth_theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle eye icon
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

    // Sign Up page - confirm password toggle
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);

            // Toggle eye icon
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

    // Sign In Form Submit
    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const terms = document.getElementById('terms').checked;

            if (!terms) {
                alert('Пожалуйста, примите условия использования');
                return;
            }

            // Simple auth - check localStorage
            const users = JSON.parse(localStorage.getItem('breadixai_users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                localStorage.setItem('breadixai_logged_in', 'true');
                localStorage.setItem('breadixai_current_user', username);
                window.location.href = 'index.html';
            } else {
                alert('Неверный логин или пароль');
            }
        });
    }

    // Sign Up Form Submit
    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            if (!terms) {
                alert('Пожалуйста, примите условия использования');
                return;
            }

            if (password !== confirmPassword) {
                alert('Пароли не совпадают');
                return;
            }

            if (password.length < 4) {
                alert('Пароль должен содержать минимум 4 символа');
                return;
            }

            // Save to localStorage
            const users = JSON.parse(localStorage.getItem('breadixai_users') || '[]');

            // Check if user already exists
            if (users.find(u => u.username === username)) {
                alert('Пользователь с таким логином уже существует');
                return;
            }

            users.push({ username, password });
            localStorage.setItem('breadixai_users', JSON.stringify(users));

            alert('Регистрация успешна! Теперь вы можете войти.');
            window.location.href = 'sign_in.html';
        });
    }
});
