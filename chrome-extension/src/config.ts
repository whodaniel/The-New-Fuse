// Shared configuration between Chrome extension and VS Code extension
export const CONFIG = {
    // WebSocket Configuration
    WS_PORT: 3712,
    WS_HOST: 'localhost',
    WS_PROTOCOL: 'ws',
    
    // Connection Settings
    MAX_RETRY_ATTEMPTS: 5,
    RETRY_DELAY: 2000,
    PING_INTERVAL: 30000,
    CONNECTION_TIMEOUT: 10000,
    
    // Feature Flags
    ENABLE_COMPRESSION: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_AUTH: true,
    
    // Rate Limiting
    RATE_LIMIT_MAX_MESSAGES: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    
    // Security
    AUTH_TOKEN_EXPIRY: 3600000, // 1 hour
    REFRESH_TOKEN_EXPIRY: 86400000, // 24 hours

    // Debug
    DEBUG_MODE_DEFAULT: false,
};