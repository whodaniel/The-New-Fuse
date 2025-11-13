export * from './EncryptionService';
export * from './SecurityService';
export * from './auth';
export * from './audit';
export * from './rate-limiting';
export * from './middleware';
export type { AuditStorage } from './audit/storage';
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