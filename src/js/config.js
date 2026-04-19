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

const MODELS = {};

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
