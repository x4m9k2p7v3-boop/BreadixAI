// ========================================
// PIN FEATURES (WITHOUT DRAG & DROP)
// ========================================

// Storage for pinned chats
let pinnedChats = JSON.parse(localStorage.getItem('breadixai_pinned_chats') || '[]');

// Save pinned chats to localStorage
function savePinnedChats() {
    localStorage.setItem('breadixai_pinned_chats', JSON.stringify(pinnedChats));
}

// Toggle pin status
function togglePinChat(chatId) {
    const index = pinnedChats.indexOf(chatId);
    if (index > -1) {
        pinnedChats.splice(index, 1);
        showToast('Чат откреплен', 'check');
    } else {
        pinnedChats.push(chatId);
        showToast('Чат закреплен', 'check');
    }
    savePinnedChats();
    updateChatHistory();
}

// Check if chat is pinned
function isChatPinned(chatId) {
    return pinnedChats.includes(chatId);
}

// Sort chats by pinned status
function sortChatsWithPin(chats) {
    const pinned = chats.filter(chat => isChatPinned(chat.id));
    const unpinned = chats.filter(chat => !isChatPinned(chat.id));

    pinned.sort((a, b) => b.timestamp - a.timestamp);
    unpinned.sort((a, b) => b.timestamp - a.timestamp);

    return { pinned, unpinned };
}

// Store original updateChatHistory
const originalUpdateChatHistoryPin = updateChatHistory;

// Override updateChatHistory
updateChatHistory = function() {
    chatHistoryContainer.innerHTML = '';

    const { pinned, unpinned } = sortChatsWithPin(chatHistory);

    // Add pinned section
    if (pinned.length > 0) {
        const pinnedLabel = document.createElement('div');
        pinnedLabel.className = 'pinned-label';
        pinnedLabel.textContent = 'Закрепленные';
        chatHistoryContainer.appendChild(pinnedLabel);

        pinned.forEach(chat => {
            const chatItem = createChatItemWithPin(chat, true);
            chatHistoryContainer.appendChild(chatItem);
        });

        if (unpinned.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'pinned-separator';
            chatHistoryContainer.appendChild(separator);
        }
    }

    // Add unpinned chats grouped by time
    const groups = groupChatsByTime(unpinned);

    Object.keys(groups).forEach(groupName => {
        if (groups[groupName].length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'chat-group';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'chat-group-title';
        titleDiv.textContent = groupName;
        groupDiv.appendChild(titleDiv);

        groups[groupName].forEach(chat => {
            const chatItem = createChatItemWithPin(chat, false);
            groupDiv.appendChild(chatItem);
        });

        chatHistoryContainer.appendChild(groupDiv);
    });
};

// Create chat item with pin support
function createChatItemWithPin(chat, isPinned) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item' + (isPinned ? ' pinned' : '');
    chatItem.dataset.chatId = chat.id;

    if (chat.id === currentChatId) {
        chatItem.classList.add('active');
    }

    chatItem.innerHTML = `
        <svg class="chat-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chat-item-text">${escapeHtml(chat.title)}</span>
        <div class="chat-item-menu">
            <button class="chat-menu-btn" onclick="showChatMenuWithPin(event, '${chat.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                </svg>
            </button>
        </div>
    `;

    chatItem.querySelector('.chat-item-text').addEventListener('click', () => loadChat(chat.id));

    return chatItem;
}

// Enhanced context menu with pin option
window.showChatMenuWithPin = function(event, chatId) {
    event.stopPropagation();
    closeContextMenu();

    const isPinned = isChatPinned(chatId);
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.id = 'contextMenu';

    menu.innerHTML = `
        <div class="context-menu-item" onclick="togglePinChat('${chatId}'); closeContextMenu();">
            ${isPinned ? 'Открепить' : 'Закрепить'}
        </div>
        <div class="context-menu-item" onclick="renameChat('${chatId}')">Переименовать</div>
        <div class="context-menu-item danger" onclick="deleteChat('${chatId}')">Удалить</div>
    `;

    document.body.appendChild(menu);

    const rect = event.target.closest('.chat-menu-btn').getBoundingClientRect();
    menu.style.left = rect.right + 8 + 'px';
    menu.style.top = rect.top + 'px';
};

console.log('✨ Pin features loaded!');
