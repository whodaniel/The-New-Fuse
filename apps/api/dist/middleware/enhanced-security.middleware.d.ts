import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityLoggingService } from '../security/security-logging.service';
import { EnhancedRateLimitService } from '../security/enhanced-rate-limit.service';
import { InputSanitizationService } from '../security/input-sanitization.service';
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            timestamp?: string;
            clientIP?: string;
            userAgent?: string;
            securityFlags?: {
                isBot?: boolean;
                isSuspicious?: boolean;
                threatLevel?: 'low' | 'medium' | 'high' | 'critical';
            };
        }
    }
}
export declare class EnhancedSecurityMiddleware implements NestMiddleware {
    private securityLogging;
    private rateLimitService;
    private inputSanitization;
    private readonly logger;
    constructor(securityLogging: SecurityLoggingService, rateLimitService: EnhancedRateLimitService, inputSanitization: InputSanitizationService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Perform comprehensive security analysis
     */
    private performSecurityAnalysis;
    /**
     * Enforce rate limiting with enhanced rules
     */
    private enforceRateLimiting;
    /**
     * Sanitize and validate input
     */
    private sanitizeAndValidateInput;
    /**
     * Inject comprehensive security headers
     */
    private injectSecurityHeaders;
    /**
     * Log API response for monitoring
     */
    private logApiResponse;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
    /**
     * Get client IP address
     */
    private getClientIP;
    /**
     * Detect bot traffic
     */
    private detectBot;
    /**
     * Detect SQL injection patterns
     */
    private detectSQLInjection;
    /**
     * Detect XSS patterns
     */
    private detectXSS;
    /**
     * Detect path traversal attempts
     */
    private detectPathTraversal;
    /**
     * Detect unusual request patterns
     */
    private detectUnusualPattern;
    /**
     * Sanitize headers for logging
     */
    private sanitizeHeaders;
}
//# sourceMappingURL=enhanced-security.middleware.d.ts.map