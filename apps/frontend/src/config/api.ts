export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const API_TIMEOUT = 30000;

// Determine version prefix based on environment
// Production (live site) uses the Unified API Gateway with /v1 prefix
const VERSION = import.meta.env.PROD ? '/v1' : '/api';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${VERSION}/auth/register`,
    LOGIN: `${VERSION}/auth/login`,
    LOGOUT: `${VERSION}/auth/logout`,
    REFRESH: `${VERSION}/auth/refresh`,
    ME: `${VERSION}/auth/me`,
  },
  AGENTS: {
    BASE: `${VERSION}/agents`,
    ACTIVE: `${VERSION}/agents/active`,
  },
};
