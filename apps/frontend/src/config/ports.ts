/**
 * Standardized port configuration for The New Fuse
 * This ensures consistent port usage across all services
 */

export const STANDARD_PORTS = {
  // Frontend development server
  FRONTEND: 3000,

  // Unified API Gateway (NEW - consolidates all APIs)
  API_GATEWAY: 8080,

  // Individual Backend Services (behind gateway)
  BACKEND_API: 3001,
  WEBHOOKS_API: 3002,

  // WebSocket server
  WEBSOCKET: 3002,

  // Prisma Studio (database UI)
  DATABASE_UI: 5555,

  // Additional services (reserved)
  REDIS: 6379,
  POSTGRES: 5432,

  // Preview/production preview
  PREVIEW: 4173,
} as const;

// Environment-based configuration
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default to unified API Gateway
  return `http://localhost:${STANDARD_PORTS.API_GATEWAY}`;
};

export const getWebSocketUrl = () => {
  // First check for explicit environment variable
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // In browser, detect based on current location
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Production: thenewfuse.com
    if (host.includes('thenewfuse.com')) {
      return `wss://thenewfuse.com/ws`;
    }

    // Railway deployments
    if (host.includes('railway.app')) {
      return `${protocol}//${host}/ws`;
    }
  }

  // Default to localhost for local development
  return `ws://localhost:${STANDARD_PORTS.WEBSOCKET}`;
};

export const getFrontendUrl = () => {
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL;
  }

  return `http://localhost:${STANDARD_PORTS.FRONTEND}`;
};
