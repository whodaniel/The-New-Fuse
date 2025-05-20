// Export all security services and types
export * from './EncryptionService.js';
export * from './SecurityService.js';
export * from './auth.js';
export * from './audit.js';
export * from './rate-limiting.js';
export * from './middleware.js';

// Re-export types
export type { AuditStorage } from './audit/storage.js';

// Default configuration
export const defaultConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    iterations: 32768,
    keyLength: 32
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  }
};
