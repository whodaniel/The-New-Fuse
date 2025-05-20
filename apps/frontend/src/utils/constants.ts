export {}
exports.RATE_LIMITS = exports.SUPPORTED_FILE_TYPES = exports.MAX_FILE_SIZE = exports.ROLES = exports.THEMES = exports.LOCAL_STORAGE_KEYS = exports.WEBSOCKET_EVENTS = exports.API_ENDPOINTS = exports.WS_BASE_URL = exports.API_BASE_URL = void 0;
exports.API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
exports.WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
exports.API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${exports.API_BASE_URL}/auth/login`,
        REGISTER: `${exports.API_BASE_URL}/auth/register`,
        LOGOUT: `${exports.API_BASE_URL}/auth/logout`,
        ME: `${exports.API_BASE_URL}/auth/me`,
    },
    AGENTS: {
        LIST: `${exports.API_BASE_URL}/agents`,
        CREATE: `${exports.API_BASE_URL}/agents`,
        UPDATE: (id) => `${exports.API_BASE_URL}/agents/${id}`,
        DELETE: (id) => `${exports.API_BASE_URL}/agents/${id}`,
    },
    WORKFLOWS: {
        LIST: `${exports.API_BASE_URL}/workflows`,
        CREATE: `${exports.API_BASE_URL}/workflows`,
        UPDATE: (id) => `${exports.API_BASE_URL}/workflows/${id}`,
        DELETE: (id) => `${exports.API_BASE_URL}/workflows/${id}`,
    },
    MARKETPLACE: {
        LIST: `${exports.API_BASE_URL}/marketplace`,
        DETAILS: (id) => `${exports.API_BASE_URL}/marketplace/${id}`,
        PURCHASE: (id) => `${exports.API_BASE_URL}/marketplace/${id}/purchase`,
    },
};
exports.WEBSOCKET_EVENTS = {
    AGENT_STATUS: 'agent_status',
    WORKFLOW_UPDATE: 'workflow_update',
    CHAT_MESSAGE: 'chat_message',
    SYSTEM_NOTIFICATION: 'system_notification',
};
export const LOCAL_STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
};
exports.THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
};
exports.ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    AGENT: 'agent',
};
exports.MAX_FILE_SIZE = 10 * 1024 * 1024;
exports.SUPPORTED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.json'];
exports.RATE_LIMITS = {
    API_CALLS_PER_MINUTE: 60,
    WEBSOCKET_MESSAGES_PER_MINUTE: 100,
};
//# sourceMappingURL=constants.js.map