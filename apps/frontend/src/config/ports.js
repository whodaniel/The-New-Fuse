/**
 * Standardized port configuration for The New Fuse
 * This ensures consistent port usage across all services
 */
export var STANDARD_PORTS = {
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
    PREVIEW: 4173
};
// Environment-based configuration
export var getApiUrl = function () {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Default to unified API Gateway
    return "http://localhost:".concat(STANDARD_PORTS.API_GATEWAY);
};
export var getWebSocketUrl = function () {
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }
    return "ws://localhost:".concat(STANDARD_PORTS.WEBSOCKET);
};
export var getFrontendUrl = function () {
    if (import.meta.env.VITE_FRONTEND_URL) {
        return import.meta.env.VITE_FRONTEND_URL;
    }
    return "http://localhost:".concat(STANDARD_PORTS.FRONTEND);
};
