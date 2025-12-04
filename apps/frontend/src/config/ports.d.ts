/**
 * Standardized port configuration for The New Fuse
 * This ensures consistent port usage across all services
 */
export declare const STANDARD_PORTS: {
    readonly FRONTEND: 3000;
    readonly API_GATEWAY: 8080;
    readonly BACKEND_API: 3001;
    readonly WEBHOOKS_API: 3002;
    readonly WEBSOCKET: 3002;
    readonly DATABASE_UI: 5555;
    readonly REDIS: 6379;
    readonly POSTGRES: 5432;
    readonly PREVIEW: 4173;
};
export declare const getApiUrl: () => string;
export declare const getWebSocketUrl: () => string;
export declare const getFrontendUrl: () => any;
