// Integration of all new features
// This file connects features.js with the main script.js

let voiceInput = null;
let keyboardShortcuts = null;

// Microphone Permission Modal
function showMicrophonePermissionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="margin: 0 auto;">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            </div>
            <h3 style="margin: 0 0 12px 0; font-size: 20px; color: var(--text-primary); text-align: center;">Требуется доступ к микрофону</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.6; text-align: center;">
                Для использования голосового ввода необходимо разрешить доступ к микрофону в настройках браузера.
            </p>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0 0 8px 0;"><strong>Как разрешить:</strong></p>
                <ol style="color: var(--text-secondary); font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Нажмите на иконку замка/микрофона в адресной строке</li>
                    <li>Выберите "Разрешить" для микрофона</li>
                    <li>Перезагрузите страницу</li>
                </ol>
            </div>
            <button id="closeMicPermissionModal" class="settings-btn" style="width: 100%;">Понятно</button>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeMicPermissionModal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Initialize all new features
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for database to initialize
    await stableDB.init();

    // Initialize voice input
    voiceInput = new VoiceInput();
    const voiceBtn = document.getElementById('voiceBtn');

    if (voiceInput.isSupported()) {
        voiceBtn.style.display = 'flex';

        voiceBtn.addEventListener('click', () => {
            if (voiceInput.isListening) {
                voiceInput.stop();
                voiceBtn.classList.remove('voice-active');
            } else {
                voiceInput.start(
                    (transcript, isFinal) => {
                        const messageInput = document.getElementById('messageInput');

                        if (isFinal) {
                            // Final result - add to existing text
                            messageInput.value += (messageInput.value ? ' ' : '') + transcript;
                        } else {
                            // Interim result - show in real-time (will be replaced by final)
                            const currentText = messageInput.value;
                            const lastSpace = currentText.lastIndexOf(' ');
                            const baseText = lastSpace >= 0 ? currentText.substring(0, lastSpace + 1) : '';
                            messageInput.value = baseText + transcript;
                        }

                        messageInput.focus();
                        autoResizeTextarea();
                        sendBtn.disabled = !messageInput.value.trim();
                    },
                    (error) => {
                        voiceBtn.classList.remove('voice-active');

                        // Show permission request notification only for permission errors
                        if (error === 'not-allowed') {
                            showMicrophonePermissionModal();
                        }
                    },
                    () => {
                        // Only add animation when recording actually starts
                        voiceBtn.classList.add('voice-active');
                    }
                );
            }
        });
    }

    // Initialize keyboard shortcuts
    keyboardShortcuts = new KeyboardShortcuts();

    // Global functions for shortcuts
    window.createNewChat = createNewChat;
    window.showKeyboardHelp = showKeyboardHelp;
    window.exportChatsAction = exportChatsAction;

    // Initialize user menu features
    await initAdvancedUserMenu();

    // Load and display avatar
    await loadUserAvatar();

    // Log activity
    const currentUser = localStorage.getItem('breadixai_current_user');
    if (currentUser) {
        await ActivityHistory.log(currentUser, 'login', { timestamp: new Date().toISOString() });
    }
});

// Advanced User Menu
async function initAdvancedUserMenu() {
    const currentUser = localStorage.getItem('breadixai_current_user');

    // Avatar upload
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');

    if (uploadAvatarBtn) {
        uploadAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert('Файл слишком большой. Максимум 2MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (event) => {
                    await AvatarManager.save(currentUser, event.target.result);
                    await loadUserAvatar();
                    showToast('Аватар обновлён', 'check');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', async () => {
            if (confirm('Удалить аватар?')) {
                await AvatarManager.delete(currentUser);
                await loadUserAvatar();
                showToast('Аватар удалён', 'check');
            }
        });
    }

    // Change password
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeChangePassword = document.getElementById('closeChangePassword');
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            changePasswordModal.classList.add('active');
        });
    }

    if (closeChangePassword) {
        closeChangePassword.addEventListener('click', () => {
            changePasswordModal.classList.remove('active');
            changePasswordForm.reset();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            // Verify current password
            const user = await stableDB.getUser(currentUser);

            if (!user || user.password !== hashPassword(currentPassword)) {
                alert('Неверный текущий пароль');
                return;
            }

            // Validate new password
            const passwordErrors = validatePassword(newPassword);
            if (passwordErrors.length > 0) {
                alert(passwordErrors.join('\n'));
                return;
            }

            if (newPassword !== confirmNewPassword) {
                alert('Новые пароли не совпадают');
                return;
            }

            // Update password
            user.password = hashPassword(newPassword);
            await stableDB.saveUser(user);

            await ActivityHistory.log(currentUser, 'password_changed');

            changePasswordModal.classList.remove('active');
            changePasswordForm.reset();
            showToast('Пароль успешно изменён', 'check');
        });
    }

    // Activity history
    await loadActivityHistory();

    // Export/Import chats
    const exportChatsBtn = document.getElementById('exportChatsBtn');
    const importChatsBtn = document.getElementById('importChatsBtn');
    const importChatsInput = document.getElementById('importChatsInput');

    if (exportChatsBtn) {
        exportChatsBtn.addEventListener('click', exportChatsAction);
    }

    if (importChatsBtn) {
        importChatsBtn.addEventListener('click', () => {
            importChatsInput.click();
        });
    }

    if (importChatsInput) {
        importChatsInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const result = await ChatManager.importChats(event.target.result);
                    if (result.success) {
                        showToast(`Импортировано чатов: ${result.imported}`, 'check');
                        loadChatHistory();
                        await ActivityHistory.log(currentUser, 'chats_imported', { count: result.imported });
                    } else {
                        alert(`Ошибка импорта: ${result.error}`);
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const confirmed = confirm(
                'Вы уверены? Все ваши данные будут удалены безвозвратно. Это действие нельзя отменить.'
            );

            if (confirmed) {
                // Delete all user data from database
                await stableDB.deleteAllUserData(currentUser);

                localStorage.removeItem('breadixai_logged_in');
                localStorage.removeItem('breadixai_current_user');

                showToast('Аккаунт удалён', 'check');
                setTimeout(() => {
                    window.location.href = 'sign_in.html';
                }, 1000);
            }
        });
    }

    // Load statistics
    await loadStatistics();
}

async function loadUserAvatar() {
    const currentUser = localStorage.getItem('breadixai_current_user');
    const avatarPreview = document.getElementById('avatarPreview');
    const userName = document.getElementById('userName');

    if (!currentUser || !avatarPreview) return;

    const avatar = await AvatarManager.get(currentUser);

    if (avatar) {
        avatarPreview.innerHTML = `<img src="${avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        if (userName) {
            const userAvatar = userName.previousElementSibling;
            if (userAvatar && userAvatar.tagName === 'svg') {
                userAvatar.outerHTML = `<img src="${avatar}" style="width: 18px; height: 18px; object-fit: cover; border-radius: 50%;">`;
            }
        }
    } else {
        avatarPreview.textContent = AvatarManager.getInitials(currentUser);
    }
}

async function loadActivityHistory() {
    const currentUser = localStorage.getItem('breadixai_current_user');
    const activityHistory = document.getElementById('activityHistory');

    if (!activityHistory) return;

    const history = await ActivityHistory.get(currentUser);

    if (history.length === 0) {
        activityHistory.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">История активности пуста</p>';
        return;
    }

    activityHistory.innerHTML = history.slice(0, 10).map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleString('ru-RU');

        let actionText = item.action;
        if (item.action === 'login') actionText = 'Вход в систему';
        if (item.action === 'password_changed') actionText = 'Смена пароля';
        if (item.action === 'chats_exported') actionText = 'Экспорт чатов';
        if (item.action === 'chats_imported') actionText = 'Импорт чатов';

        return `
            <div class="activity-item">
                <div class="activity-item-header">
                    <span class="activity-item-action">${actionText}</span>
                    <span class="activity-item-time">${timeStr}</span>
                </div>
                <div class="activity-item-details">${item.platform}</div>
            </div>
        `;
    }).join('');
}

async function loadStatistics() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const stats = await UsageStats.getStats();
    const totalTokens = await UsageStats.getTotalTokens();
    const mostUsedModel = await UsageStats.getMostUsedModel();

    const chats = await stableDB.getChatsByUser(localStorage.getItem('breadixai_current_user'));
    const totalChats = chats.length;

    let totalMessages = 0;
    for (const chat of chats) {
        const messages = await stableDB.getMessagesByChat(chat.id);
        totalMessages += messages.length;
    }

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-label">Всего токенов</div>
                <div class="stat-card-value">${formatNumber(totalTokens)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Всего чатов</div>
                <div class="stat-card-value">${totalChats}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Всего сообщений</div>
                <div class="stat-card-value">${totalMessages}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Любимая модель</div>
                <div class="stat-card-value" style="font-size: 16px;">${mostUsedModel ? getModelName(mostUsedModel) : 'Нет данных'}</div>
            </div>
        </div>

        <h4 style="margin-top: 24px; margin-bottom: 12px;">Использование по моделям</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            ${Object.entries(stats.total || {}).map(([model, tokens]) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
                    <span style="color: var(--text-primary);">${getModelName(model)}</span>
                    <span style="color: var(--text-secondary); font-weight: 600;">${formatNumber(tokens)} токенов</span>
                </div>
            `).join('')}
        </div>
    `;
}

async function exportChatsAction() {
    const currentUser = localStorage.getItem('breadixai_current_user');
    const data = await ChatManager.exportChats();

    if (!data) {
        alert('Нет чатов для экспорта');
        return;
    }

    const filename = `breadixai_chats_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    ChatManager.downloadAsFile(data, filename);

    await ActivityHistory.log(currentUser, 'chats_exported');
    showToast('Чаты экспортированы', 'check');
}

function showKeyboardHelp() {
    const modal = document.getElementById('keyboardHelpModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close keyboard help modal
const closeKeyboardHelp = document.getElementById('closeKeyboardHelp');
if (closeKeyboardHelp) {
    closeKeyboardHelp.addEventListener('click', () => {
        document.getElementById('keyboardHelpModal').classList.remove('active');
    });
}

// Add favorite functionality to messages
window.toggleFavorite = async function(btn) {
    const messageDiv = btn.closest('.message');
    const messageContent = messageDiv.querySelector('.message-content').textContent;
    const messageId = 'msg_' + Date.now();

    if (btn.classList.contains('favorite-active')) {
        btn.classList.remove('favorite-active');
        await FavoritesManager.remove(messageId);
        showToast('Удалено из избранного', 'check');
    } else {
        btn.classList.add('favorite-active');
        await FavoritesManager.add(messageId, messageContent, currentModel);
        showToast('Добавлено в избранное', 'check');
    }
};

// Override addMessageActions to include favorite button
const originalAddMessageActions = window.addMessageActions;
window.addMessageActions = function(messageDiv) {
    if (originalAddMessageActions) {
        originalAddMessageActions(messageDiv);
    }

    const actionsDiv = messageDiv.querySelector('.message-actions');
    if (actionsDiv) {
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'action-btn';
        favoriteBtn.title = 'Избранное';
        favoriteBtn.onclick = function() { toggleFavorite(this); };
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        `;
        actionsDiv.appendChild(favoriteBtn);
    }
};

// Record stats when sending messages
const originalSendMessage = window.sendMessage;
if (originalSendMessage) {
    window.sendMessage = async function() {
        await originalSendMessage();

        // Record usage stats
        const tokensUsed = estimateTokens(messageInput.value);
        await UsageStats.record(currentModel, tokensUsed);
    };
}

console.log('✅ All features initialized successfully');

// String Lamp Animation for Sidebar Toggle
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        // Override the original click handler
        const originalToggle = sidebarToggle.onclick;
        sidebarToggle.onclick = null;

        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // If sidebar is open, just close it without animation
            if (!sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                sidebar.classList.remove('open');
                return;
            }

            // If sidebar is closed, play animation then open
            sidebarToggle.classList.add('pulling');

            // Wait for animation to complete (400ms), then open sidebar
            setTimeout(() => {
                sidebarToggle.classList.remove('pulling');

                // Now open the sidebar
                sidebar.classList.remove('collapsed');
                sidebar.classList.add('open');
            }, 400);
        });
    }
});
