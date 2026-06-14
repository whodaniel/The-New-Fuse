import { InputSanitizationService } from './input-sanitization.service';
export interface ResponseSanitizationOptions {
    excludeFields?: string[];
    maskFields?: string[];
    maskChar?: string;
    maxDepth?: number;
    sensitiveDataPatterns?: RegExp[];
}
export declare class ResponseSanitizationService {
    private sanitizationService;
    private defaultSensitivePatterns;
    constructor(sanitizationService: InputSanitizationService);
    /**
     * Sanitize response object to remove sensitive information
     */
    sanitizeResponse<T>(data: T, options?: ResponseSanitizationOptions): T;
    /**
     * Sanitize database query results
     */
    sanitizeDatabaseResult<T>(data: T, options?: ResponseSanitizationOptions): T;
    /**
     * Sanitize user profile data
     */
    sanitizeUserProfile<T>(data: T, isOwner?: boolean): T;
    /**
     * Sanitize API error responses
     */
    sanitizeError(error: any): any;
    /**
     * Sanitize logs to prevent sensitive data leakage
     */
    sanitizeLogData(data: any): any;
    private sanitizeObject;
    private sanitizeString;
    private maskValue;
    private matchesPattern;
    private isSensitiveField;
    private sanitizeErrorMessage;
    private sanitizeStackTrace;
    /**
     * Create a sanitized version of an object for logging
     */
    createLogSafeObject(obj: any): any;
    /**
     * Remove PII (Personally Identifiable Information) from data
     */
    removePII(data: any): any;
}
//# sourceMappingURL=response-sanitization.service.d.ts.map