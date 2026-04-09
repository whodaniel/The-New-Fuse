export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || '/ws';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  AGENTS: {
    LIST: `${API_BASE_URL}/agents`,
    CREATE: `${API_BASE_URL}/agents`,
    UPDATE: (id: string) => `${API_BASE_URL}/agents/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/agents/${id}`,
  },
  WORKFLOWS: {
    LIST: `${API_BASE_URL}/workflows`,
    CREATE: `${API_BASE_URL}/workflows`,
    UPDATE: (id: string) => `${API_BASE_URL}/workflows/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/workflows/${id}`,
  },
  MARKETPLACE: {
    LIST: `${API_BASE_URL}/marketplace`,
    DETAILS: (id: string) => `${API_BASE_URL}/marketplace/${id}`,
    PURCHASE: (id: string) => `${API_BASE_URL}/marketplace/${id}/purchase`,
  },
};

export const WEBSOCKET_EVENTS = {
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

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  AGENT: 'agent',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json',
];

export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  WEBSOCKET_MESSAGES_PER_MINUTE: 100,
};
