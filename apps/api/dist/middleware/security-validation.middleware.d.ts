import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { InputSanitizationService } from '../security/input-sanitization.service';
export interface SecurityValidationOptions {
    sanitize?: boolean;
    maxLength?: number;
    allowedFields?: string[];
    forbiddenFields?: string[];
    validateEmail?: boolean;
    validatePhone?: boolean;
    validateUrl?: boolean;
    validateIP?: boolean;
    strictMode?: boolean;
}
export declare class SecurityValidationMiddleware implements NestMiddleware {
    private readonly sanitizationService;
    constructor(sanitizationService: InputSanitizationService);
    use(req: Request, res: Response, next: NextFunction): void;
    private addSecurityHeaders;
    private sanitizeRequestData;
    private sanitizeObject;
    private sanitizeString;
    private addRequestId;
    private generateRequestId;
    private getSafeHeaders;
    private isEmail;
    private isPhoneNumber;
    private isUrl;
    private isHTML;
    private isIPAddress;
}
//# sourceMappingURL=security-validation.middleware.d.ts.map