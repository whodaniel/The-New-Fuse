import { Buffer } from 'buffer';

// Use built-in BufferEncoding type from Node.js
type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

export interface EncryptionConfig {
    algorithm: string;
    secretKey: string;
    iv?: Buffer;
    encoding: BufferEncoding;
}
export interface HashConfig {
    algorithm: 'sha256' | 'sha512' | 'md5';
    encoding: 'hex' | 'base64';
    iterations?: number;
    keyLength?: number;
}
export interface SecurityContext {
    userId: string;
    roles: string[];
    permissions: string[];
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export interface AuditLogEntry {
    timestamp: Date;
    action: string;
    userId: string;
    resource: string;
    details: Record<string, unknown>;
    status: 'success' | 'failure';
    ip?: string;
    userAgent?: string;
}
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    statusCode?: number;
    headers?: boolean;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
}
export interface SecurityHeaders {
    'Content-Security-Policy'?: string;
    'Strict-Transport-Security'?: string;
    'X-Content-Type-Options'?: string;
    'X-Frame-Options'?: string;
    'X-XSS-Protection'?: string;
    'Referrer-Policy'?: string;
}
export type ValidationRule = {
    field: string;
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: unknown;
    message?: string;
    validator?: (value: unknown) => boolean | Promise<boolean>;
};
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string[]>;
}
