const API_CONFIG = {
    // Автоматически определяем окружение
    baseUrl: window.location.hostname === 'localhost'
        ? ''
        : 'https://breadixai-api.v-e-kikkas.workers.dev',
    chatUrl: '/api/chat',
    searchUrl: '/api/search',

    // Полные URL для запросов
    get fullChatUrl() {
        return this.baseUrl + this.chatUrl;
    },
    get fullSearchUrl() {
        return this.baseUrl + this.searchUrl;
    }
};

const MODELS = {
    // Флагманские модели
    'kr/claude-sonnet-4.5': {
        name: 'Claude Sonnet',
        category: 'flagship',
        description: 'Флагманская модель Anthropic с глубоким мышлением',
        maxTokens: 200000,
        hasVision: true,
        hasThinking: true
    },
    'kc/openai/gpt-5-mini': {
        name: 'GPT-5 Mini',
        category: 'flagship',
        description: 'Компактная версия GPT-5 от OpenAI',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/deepseek/deepseek-v3.2': {
        name: 'DeepSeek V3',
        category: 'flagship',
        description: 'Продвинутая модель с глубоким анализом',
        maxTokens: 64000,
        hasThinking: true
    },
    'kc/moonshotai/kimi-k2.5': {
        name: 'Kimi K2.5',
        category: 'flagship',
        description: 'Модель с большим контекстом',
        maxTokens: 200000
    },

    // Продвинутые модели
    'kc/anthropic/claude-3-haiku': {
        name: 'Claude Haiku',
        category: 'advanced',
        description: 'Быстрая и эффективная модель от Anthropic',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/google/gemini-2.5-flash-lite': {
        name: 'Gemini Flash Lite',
        category: 'advanced',
        description: 'Облегчённая версия Gemini',
        maxTokens: 1000000,
        hasVision: true
    },
    'kc/deepseek/deepseek-chat-v3.1': {
        name: 'DeepSeek Chat',
        category: 'advanced',
        description: 'Чат-модель DeepSeek',
        maxTokens: 64000
    },
    'kc/meta-llama/llama-4-maverick': {
        name: 'Llama 4 Maverick',
        category: 'advanced',
        description: 'Продвинутая модель Llama 4 от Meta',
        maxTokens: 128000
    },
    'kc/qwen/qwen3-32b': {
        name: 'Qwen3 32B',
        category: 'advanced',
        description: 'Продвинутая модель Qwen',
        maxTokens: 32000
    },
    'kc/qwen/qwq-32b': {
        name: 'QwQ 32B',
        category: 'advanced',
        description: 'Модель для сложных задач с thinking режимом',
        maxTokens: 32000,
        hasThinking: true
    },

    // Быстрые модели
    'kc/google/gemini-2.0-flash': {
        name: 'Gemini Flash',
        category: 'fast',
        description: 'Молниеносная модель Google',
        maxTokens: 1000000,
        hasVision: true
    },
    'kc/openai/gpt-4o-mini': {
        name: 'GPT-4o Mini',
        category: 'fast',
        description: 'Компактная версия GPT-4o',
        maxTokens: 128000,
        hasVision: true
    },
    'groq/llama-3.3-70b-versatile': {
        name: 'Llama 3.3 Groq',
        category: 'fast',
        description: 'Универсальная модель Llama',
        maxTokens: 128000
    }
};

function getModelName(modelId) {
    return MODELS[modelId]?.name || modelId;
}

function getModelsByCategory(category) {
    return Object.entries(MODELS)
        .filter(([_, model]) => model.category === category)
        .map(([id, model]) => ({ id, ...model }));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, MODELS, getModelName, getModelsByCategory };
}
