const API_CONFIG = {
    // Автоматически определяем окружение
    baseUrl: window.location.hostname === 'localhost'
        ? ''
        : 'https://breadixai-production.up.railway.app',
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
        name: 'Claude Sonnet 4.6 Thinking',
        category: 'flagship',
        description: 'Флагманская модель Anthropic с глубоким мышлением',
        maxTokens: 200000,
        hasVision: true,
        hasThinking: true
    },
    'groq/openai/gpt-oss-120b': {
        name: 'GPT-OSS 120B Thinking',
        category: 'flagship',
        description: 'Мощная open-source модель с thinking режимом',
        maxTokens: 128000,
        hasThinking: true
    },
    'cerebras/qwen-3-235b-a22b-instruct-2507': {
        name: 'Qwen3 235B Thinking',
        category: 'flagship',
        description: 'Самая мощная модель Qwen с глубоким анализом',
        maxTokens: 32000,
        hasThinking: true
    },
    'groq/meta-llama/llama-4-maverick-17b-128e-instruct': {
        name: 'Llama 4 Maverick MoE',
        category: 'flagship',
        description: 'Mixture of Experts архитектура от Meta',
        maxTokens: 128000
    },
    'kc/moonshotai/kimi-k2.5': {
        name: 'Kimi K2.5',
        category: 'flagship',
        description: 'Продвинутая китайская модель с большим контекстом',
        maxTokens: 200000
    },
    'kc/openai/gpt-5-mini': {
        name: 'GPT-5 Mini',
        category: 'flagship',
        description: 'Компактная версия GPT-5 от OpenAI',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/deepseek/deepseek-v3.2': {
        name: 'DeepSeek V3.2 Thinking',
        category: 'flagship',
        description: 'Глубокий анализ и рассуждения',
        maxTokens: 64000,
        hasThinking: true
    },

    // Продвинутые модели
    'cerebras/llama-4-scout-17b-16e-instruct': {
        name: 'Llama 4 Scout 10M',
        category: 'advanced',
        description: 'Разведывательная модель Llama 4',
        maxTokens: 128000
    },
    'groq/qwen/qwen3-32b': {
        name: 'QwQ 32B Thinking',
        category: 'advanced',
        description: 'Модель для сложных задач с thinking режимом',
        maxTokens: 32000,
        hasThinking: true
    },
    'kc/openai/gpt-5-nano': {
        name: 'GPT-5 Nano',
        category: 'advanced',
        description: 'Компактная версия GPT-5',
        maxTokens: 200000,
        hasVision: true
    },
    'gemini-cli/gemini-3-flash-preview': {
        name: 'Gemini 2.5 Flash',
        category: 'advanced',
        description: 'Быстрая модель Google с большим контекстом',
        maxTokens: 1000000,
        hasVision: true
    },
    'cerebras/zai-glm-4.7': {
        name: 'GLM 4.7',
        category: 'advanced',
        description: 'Продвинутая китайская языковая модель',
        maxTokens: 128000
    },
    'kr/claude-haiku-4.5': {
        name: 'Claude Haiku 4.5',
        category: 'advanced',
        description: 'Быстрая и эффективная модель от Anthropic',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/qwen/qwen3-coder': {
        name: 'Qwen3 Coder',
        category: 'advanced',
        description: 'Специализирована на программировании',
        maxTokens: 32000
    },

    // Быстрые модели
    'kc/google/gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        category: 'fast',
        description: 'Молниеносная модель Google',
        maxTokens: 1000000,
        hasVision: true
    },
    'groq/llama-3.3-70b-versatile': {
        name: 'Llama 3.3 70B',
        category: 'fast',
        description: 'Универсальная модель Llama',
        maxTokens: 128000
    },
    'kc/mistralai/mistral-small-24b-instruct-2501': {
        name: 'Mistral Small 24B',
        category: 'fast',
        description: 'Компактная европейская модель',
        maxTokens: 128000
    },
    'kc/openai/gpt-4.1-nano': {
        name: 'GPT-4.1 Nano',
        category: 'fast',
        description: 'Быстрая и эффективная модель OpenAI',
        maxTokens: 128000,
        hasVision: true
    },
    'kc/x-ai/grok-code-fast-1': {
        name: 'Grok Code',
        category: 'fast',
        description: 'Быстрая модель для кода от X.AI',
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
