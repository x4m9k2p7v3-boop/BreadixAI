const API_CONFIG = {
    chatUrl: '/api/chat',
    searchUrl: '/api/search'
};

const MODELS = {
    'kc/openai/gpt-4.1-nano': {
        name: 'GPT-4.1 Mini',
        category: 'openai',
        description: 'Быстрая и эффективная модель OpenAI',
        maxTokens: 128000,
        hasVision: true
    },
    'kc/openai/gpt-5-nano': {
        name: 'GPT-5 Nano',
        category: 'openai',
        description: 'Компактная версия GPT-5',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/openai/gpt-5-mini': {
        name: 'GPT-5 Mini',
        category: 'openai',
        description: 'Улучшенная мини-версия GPT-5',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/meta-llama/llama-3.3-70b-instruct': {
        name: 'Llama 4 Scout',
        category: 'llama',
        description: 'Разведывательная модель Llama',
        maxTokens: 128000
    },
    'kc/meta-llama/llama-4-scout': {
        name: 'Llama 4 Maverick',
        category: 'llama',
        description: 'Продвинутая Llama модель',
        maxTokens: 128000
    },
    'kc/meta-llama/llama-4-maverick': {
        name: 'Llama 4',
        category: 'llama',
        description: 'Полная версия Llama 4',
        maxTokens: 128000
    },
    'kc/qwen/qwen3-235b-a22b-thinking-2507': {
        name: 'Qwen3 235B',
        category: 'qwen',
        description: 'Мощная модель с глубоким мышлением',
        hasThinking: true,
        maxTokens: 32000
    },
    'kc/qwen/qwen3-32b': {
        name: 'Qwen3 32B',
        category: 'qwen',
        description: 'Сбалансированная Qwen модель',
        maxTokens: 32000
    },
    'kc/qwen/qwen3-coder': {
        name: 'Qwen3 Coder',
        category: 'qwen',
        description: 'Специализирована на программировании',
        maxTokens: 32000
    },
    'kc/qwen/qwq-32b': {
        name: 'QwQ 32B',
        category: 'qwen',
        description: 'Модель для сложных задач',
        hasThinking: true,
        maxTokens: 32000
    },
    'kc/anthropic/claude-3-haiku': {
        name: 'Claude Sonnet 3.5',
        category: 'other',
        description: 'Быстрая модель от Anthropic',
        maxTokens: 200000,
        hasVision: true
    },
    'kc/google/gemini-2.5-flash-lite': {
        name: 'Gemini 2.5 Flash',
        category: 'other',
        description: 'Молниеносная модель Google',
        maxTokens: 1000000,
        hasVision: true
    },
    'kc/deepseek/deepseek-v3.2': {
        name: 'DeepSeek V3',
        category: 'other',
        description: 'Глубокий анализ и рассуждения',
        hasThinking: true,
        maxTokens: 64000
    },
    'kc/mistralai/mistral-small-24b-instruct-2501': {
        name: 'Mistral Large',
        category: 'other',
        description: 'Мощная европейская модель',
        maxTokens: 128000
    },
    'kc/x-ai/grok-code-fast-1': {
        name: 'Grok 3 Mini',
        category: 'other',
        description: 'Быстрая модель от X.AI',
        maxTokens: 128000
    },
    'kc/moonshotai/kimi-k2.5': {
        name: 'Kimi K2.5',
        category: 'other',
        description: 'Продвинутая китайская модель',
        maxTokens: 200000
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
