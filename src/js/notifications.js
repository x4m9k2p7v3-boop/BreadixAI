const NotificationSystem = {
    alert(message, type = 'info') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'notification-overlay';

            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };

            const titles = {
                success: 'Успешно',
                error: 'Ошибка',
                warning: 'Внимание',
                info: 'Информация'
            };

            overlay.innerHTML = `
                <div class="notification-box">
                    <div class="notification-header">
                        <div class="notification-icon ${type}">
                            ${icons[type]}
                        </div>
                        <div class="notification-title">${titles[type]}</div>
                    </div>
                    <div class="notification-message">${message}</div>
                    <div class="notification-buttons">
                        <button class="notification-btn primary">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const btn = overlay.querySelector('.notification-btn');
            const close = () => {
                overlay.style.animation = 'fadeOut 0.15s ease forwards';
                setTimeout(() => {
                    overlay.remove();
                    resolve(true);
                }, 150);
            };

            btn.addEventListener('click', close);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });
        });
    },

    confirm(message, title = 'Подтверждение') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'notification-overlay';

            overlay.innerHTML = `
                <div class="notification-box">
                    <div class="notification-header">
                        <div class="notification-icon warning">⚠</div>
                        <div class="notification-title">${title}</div>
                    </div>
                    <div class="notification-message">${message}</div>
                    <div class="notification-buttons">
                        <button class="notification-btn secondary" data-action="cancel">Отмена</button>
                        <button class="notification-btn primary" data-action="confirm">Подтвердить</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const close = (result) => {
                overlay.style.animation = 'fadeOut 0.15s ease forwards';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 150);
            };

            overlay.querySelectorAll('.notification-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    close(btn.dataset.action === 'confirm');
                });
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(false);
            });
        });
    },

    prompt(message, defaultValue = '', title = 'Введите значение') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'notification-overlay';

            overlay.innerHTML = `
                <div class="notification-box">
                    <div class="notification-header">
                        <div class="notification-icon info">✎</div>
                        <div class="notification-title">${title}</div>
                    </div>
                    <div class="notification-message">${message}</div>
                    <input type="text" class="notification-input" value="${defaultValue}" placeholder="Введите текст...">
                    <div class="notification-buttons">
                        <button class="notification-btn secondary" data-action="cancel">Отмена</button>
                        <button class="notification-btn primary" data-action="confirm">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const input = overlay.querySelector('.notification-input');
            input.focus();
            input.select();

            const close = (result) => {
                overlay.style.animation = 'fadeOut 0.15s ease forwards';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 150);
            };

            overlay.querySelectorAll('.notification-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.action === 'confirm') {
                        close(input.value);
                    } else {
                        close(null);
                    }
                });
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    close(input.value);
                } else if (e.key === 'Escape') {
                    close(null);
                }
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(null);
            });
        });
    },

    toast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: 'Успешно',
            error: 'Ошибка',
            warning: 'Внимание',
            info: 'Информация'
        };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon ${type}">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

window.alert = (message) => NotificationSystem.alert(message, 'info');
window.confirm = (message) => NotificationSystem.confirm(message);
window.prompt = (message, defaultValue) => NotificationSystem.prompt(message, defaultValue);
