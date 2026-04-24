/**
 * API Configuration
 *
 * Single source of truth for API URL resolution.
 *
 * Strategy:
 * - Production: Cloudflare Pages Function proxies /api/* to the API Gateway.
 *   We use relative paths (/api/v1/...) so the proxy handles routing.
 * - Development: Vite dev server proxies /api/* to localhost:3001.
 *   We use relative paths (/api/...) so the Vite proxy handles routing.
 *
 * NEVER construct absolute URLs to backend services from the frontend.
 */

const API_PREFIX = import.meta.env.PROD ? '/api/v1' : '/api';

export const API_BASE = API_PREFIX;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_PREFIX}/auth/login`,
    REGISTER: `${API_PREFIX}/auth/register`,
    LOGOUT: `${API_PREFIX}/auth/logout`,
    REFRESH: `${API_PREFIX}/auth/refresh`,
    ME: `${API_PREFIX}/auth/me`,
    SUPABASE_EXCHANGE: `${API_PREFIX}/auth/supabase`,
    GOOGLE: `${API_PREFIX}/auth/google`,
    INVITE_POLICY: `${API_PREFIX}/auth/invite-policy`,
  },
  AGENTS: {
    BASE: `${API_PREFIX}/agents`,
    ACTIVE: `${API_PREFIX}/agents/active`,
  },
};

export const API_TIMEOUT = 30000;
