export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_TIMEOUT = 30000;
export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        ME: '/api/auth/me',
    },
};
//# sourceMappingURL=api.js.map