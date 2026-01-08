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

    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
};

    ADMIN: 'admin',
    USER: 'user',
    AGENT: 'agent',
};

    API_CALLS_PER_MINUTE: 60,
    WEBSOCKET_MESSAGES_PER_MINUTE: 100,
};
