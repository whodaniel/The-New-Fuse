export * from './audit/index.js';
export * from './auth/index.js';
export * from './EncryptionService.js';
export * from './middleware/index.js';
export * from './rate-limiting/index.js';
export * from './SecurityService.js';
export type { AuditStorage } from './audit/storage.js';
export declare const defaultConfig: {
    encryption: {
        algorithm: string;
        iterations: number;
        keyLength: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
//# sourceMappingURL=SecurityModule.d.ts.map