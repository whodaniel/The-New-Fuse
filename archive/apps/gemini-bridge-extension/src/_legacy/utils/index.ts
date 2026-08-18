/**
 * Export all utilities
 */
export * from './compression';
export * from './rate-limiter';
export * from './security';
export * from './websocket-manager';

// Export for global access
import { compressionUtils } from './compression';
import { RateLimiter } from './rate-limiter';
import { securityUtils } from './security';
import { WebSocketManager } from './websocket-manager';

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
