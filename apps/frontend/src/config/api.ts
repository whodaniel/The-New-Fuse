import { API_BASE as RESOLVED_API_BASE } from './api-base';

/**
 * API Configuration
 *
 * Single source of truth for API URL resolution.
 *
 * Strategy:
 * - Production: We use absolute URLs (VITE_API_URL) to bypass the broken Cloudflare
 *   Pages proxy and directly hit the API, which has proper CORS configured.
 * - Development: We use relative paths (/api) so the Vite dev server handles routing.
 *
 * Note: Auth routes live at /api/auth/* on the API service (not /api/v1/auth/*).
 * The API rewrites /api/v1/* → /api/* for backward compatibility with older clients.
 */

const API_PREFIX = RESOLVED_API_BASE;

export const API_BASE = API_PREFIX;
// Backward-compatible alias used by legacy services.
export const API_BASE_URL = API_PREFIX;

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
