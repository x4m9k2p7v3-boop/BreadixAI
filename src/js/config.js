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
        name: 'Claude Sonnet 4.6',
        category: 'flagship',
        description: 'Флагманская модель Anthropic с глубоким мышлением',
        maxTokens: 200000,
        hasVision: true,
        hasThinking: true
    },
    'kc/openai/gpt-5-mini': {
        name: 'GPT-5',
        category: 'flagship',
        description: 'Компактная версия GPT-5 от OpenAI',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/deepseek/deepseek-v3.2': {
        name: 'DeepSeek V3.2',
        category: 'flagship',
        description: 'Продвинутая модель с глубоким анализом',
        maxTokens: 64000,
        hasThinking: true
    },
    'kc/moonshotai/kimi-k2.5': {
        name: 'Kimi K2.6',
        category: 'flagship',
        description: 'Модель с большим контекстом',
        maxTokens: 200000
    },

    // Продвинутые модели
    'kc/anthropic/claude-3-haiku': {
        name: 'Claude 3.5 Haiku',
        category: 'advanced',
        description: 'Быстрая и эффективная модель от Anthropic',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/google/gemini-2.5-flash-lite': {
        name: 'Gemini 3 Flash',
        category: 'advanced',
        description: 'Облегчённая версия Gemini',
        maxTokens: 1000000,
        hasVision: true
    },
    'kc/deepseek/deepseek-chat-v3.1': {
        name: 'DeepSeek Chat V3',
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
        name: 'Qwen 3.5',
        category: 'advanced',
        description: 'Продвинутая модель Qwen',
        maxTokens: 32000
    },
    'kc/qwen/qwq-32b': {
        name: 'QwQ',
        category: 'advanced',
        description: 'Модель для сложных задач с thinking режимом',
        maxTokens: 32000,
        hasThinking: true
    },

    // Быстрые модели
    'kc/google/gemini-2.0-flash': {
        name: 'Gemini 2.1 Flash',
        category: 'fast',
        description: 'Молниеносная модель Google',
        maxTokens: 1000000,
        hasVision: true
    },
    'kc/openai/gpt-4o-mini': {
        name: 'GPT-4o',
        category: 'fast',
        description: 'Компактная версия GPT-4o',
        maxTokens: 128000,
        hasVision: true
    },
    'groq/llama-3.3-70b-versatile': {
        name: 'Llama 3.3 (70B)',
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

// Identity responses for each model
const MODEL_IDENTITY = {
    'kr/claude-sonnet-4.5': 'Я Claude Sonnet 4.6 от Anthropic — флагманская языковая модель с глубоким мышлением и анализом.',
    'kc/openai/gpt-5-mini': 'Я GPT-5 от OpenAI — компактная версия пятого поколения языковых моделей.',
    'kc/deepseek/deepseek-v3.2': 'Я DeepSeek V3.2 от DeepSeek AI — модель с глубоким анализом и рассуждениями.',
    'kc/moonshotai/kimi-k2.5': 'Я Kimi K2.6 от Moonshot AI — модель с большим контекстом до 200,000 токенов.',
    'kc/anthropic/claude-3-haiku': 'Я Claude 3.5 Haiku от Anthropic — быстрая и эффективная языковая модель.',
    'kc/google/gemini-2.5-flash-lite': 'Я Gemini 3 Flash от Google — облегчённая версия с огромным контекстом до 1,000,000 токенов.',
    'kc/deepseek/deepseek-chat-v3.1': 'Я DeepSeek Chat V3 от DeepSeek AI — чат-модель для естественного общения.',
    'kc/meta-llama/llama-4-maverick': 'Я Llama 4 Maverick от Meta AI — продвинутая языковая модель с независимым мышлением.',
    'kc/qwen/qwen3-32b': 'Я Qwen 3.5 от Alibaba Cloud — сбалансированная модель для быстрой и точной работы.',
    'kc/qwen/qwq-32b': 'Я QwQ от Alibaba Cloud — модель для сложных задач с глубоким мышлением.',
    'kc/google/gemini-2.0-flash': 'Я Gemini 2.1 Flash от Google — молниеносная модель с огромным контекстом до 1,000,000 токенов.',
    'kc/openai/gpt-4o-mini': 'Я GPT-4o от OpenAI — компактная версия GPT-4 Omni для быстрого решения задач.',
    'groq/llama-3.3-70b-versatile': 'Я Llama 3.3 (70B) от Meta AI на платформе Groq — универсальная модель со сверхбыстрой обработкой.'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, MODELS, MODEL_IDENTITY, getModelName, getModelsByCategory };
}
