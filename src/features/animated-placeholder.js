// ========================================
// ANIMATED PLACEHOLDERS
// ========================================

const placeholders = [
    'Сообщение...',
    'Создай сайт...',
    'Напиши код на Python...',
    'Объясни квантовую физику...',
    'Придумай идею для стартапа...',
    'Помоги с домашним заданием...',
    'Переведи текст на английский...',
    'Напиши стихотворение...',
    'Реши математическую задачу...',
    'Дай совет по карьере...',
    'Создай план тренировок...',
    'Придумай рецепт блюда...',
    'Напиши эссе на тему...',
    'Создай логотип для компании...',
    'Объясни как работает блокчейн...',
    'Придумай название для проекта...',
    'Напиши письмо на работу...',
    'Создай презентацию о...',
    'Помоги выбрать подарок...',
    'Расскажи интересный факт...',
    'Напиши сценарий для видео...',
    'Создай список книг для чтения...',
    'Объясни термин простыми словами...',
    'Придумай слоган для бренда...'
];

let currentPlaceholderIndex = 0;
let placeholderInterval = null;

function animatePlaceholder() {
    const input = document.getElementById('messageInput');
    if (!input) return;

    // Don't animate if user has typed something
    if (input.value.trim().length > 0) return;

    // Fade out
    input.style.transition = 'opacity 0.3s ease';
    input.style.opacity = '0';

    setTimeout(() => {
        // Change placeholder
        currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
        input.placeholder = placeholders[currentPlaceholderIndex];

        // Fade in
        input.style.opacity = '1';
    }, 300);
}

// Start animation
placeholderInterval = setInterval(animatePlaceholder, 7000);

// Stop animation when user starts typing
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('input', () => {
            if (input.value.trim().length > 0) {
                input.style.opacity = '1';
            }
        });
    }
});

console.log('✨ Animated placeholders loaded!');
