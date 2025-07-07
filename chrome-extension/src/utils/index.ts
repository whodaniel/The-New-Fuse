/**
 * Export all utilities
 */
export * from './compression.js';
export * from './websocket-manager.js';
export * from './rate-limiter.js';
export * from './security.js';

// Export for global access
import { compressionUtils } from './compression.js';
import { WebSocketManager } from './websocket-manager.js';
import { RateLimiter } from './rate-limiter.js';
import { securityUtils } from './security.js';

// Attach to window for backward compatibility
declare global {
  interface Window {
    WebSocketManager: typeof WebSocketManager;
    RateLimiter: typeof RateLimiter;
    securityUtils: typeof securityUtils;
    compressionUtils: typeof compressionUtils;
  }
}

window.WebSocketManager = WebSocketManager;
window.RateLimiter = RateLimiter;
window.securityUtils = securityUtils;
window.compressionUtils = compressionUtils;
