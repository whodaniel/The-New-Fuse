import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
export declare class CsrfProtectionMiddleware implements NestMiddleware {
    private configService;
    private csrfToken;
    private tokenStore;
    constructor(configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): void;
    private shouldSkipCsrfCheck;
    private isStateChangingRequest;
    private getSessionId;
    private extractSessionFromAuthHeader;
    private generateCsrfToken;
    private validateCsrfToken;
    private extractCsrfToken;
    private setCsrfCookie;
    private addCsrfTokenToResponse;
    /**
     * Clean up expired tokens (should be called periodically)
     */
    cleanupExpiredTokens(): void;
    /**
     * Invalidate all tokens for a session
     */
    invalidateSessionTokens(sessionId: string): void;
}
export declare function SkipCsrfValidation(): (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => void;
export declare function shouldSkipCsrf(target: any, propertyKey: string): boolean;
export declare function generateTestCsrfToken(): string;
//# sourceMappingURL=csrf-protection.middleware.d.ts.map