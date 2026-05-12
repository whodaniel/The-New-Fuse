// Export all security services and types
export * from './audit/index.js';
export * from './auth/index.js';
export * from './EncryptionService.js';
export * from './middleware/index.js';
export * from './rate-limiting/index.js';
export * from './SecurityService.js';

// Re-export types
export type { AuditStorage } from './audit/storage.js';

// Default configuration
export const defaultConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    iterations: 32768,
    keyLength: 32,
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100,
  },
};
