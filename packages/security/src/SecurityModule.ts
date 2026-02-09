// Export all security services and types
export * from './EncryptionService';
export * from './SecurityService';
export * from './auth';
export * from './audit';
export * from './rate-limiting';
export * from './middleware';

// Re-export types
export type { AuditStorage } from './audit/storage';

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
