// Export all security services and types
export * from './audit';
export * from './auth';
export * from './EncryptionService';
export * from './middleware';
export * from './rate-limiting';
export * from './SecurityService';

// Re-export types
export type { AuditStorage } from './audit/storage';

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
