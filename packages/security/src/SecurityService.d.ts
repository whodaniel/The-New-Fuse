import { Request } from 'express';
import { EncryptionService } from './EncryptionService';
import { AuthService } from './auth';
import { AuditService } from '../audit';
import { RateLimitingService } from './rate-limiting';
export declare class SecurityService {
    private readonly encryption;
    private readonly auth;
    private readonly audit;
    private readonly rateLimit;
    constructor(encryption: EncryptionService, auth: AuthService, audit: AuditService, rateLimit: RateLimitingService);
    encrypt(data: string): Promise<{
        encrypted: Buffer;
        iv: Buffer;
        tag: Buffer;
        salt?: Buffer;
    }>;
    decrypt(encryptedData: Buffer, iv: Buffer, tag: Buffer, _salt?: Buffer): Promise<string>;
    checkRateLimit(req: Request): Promise<boolean>;
    authenticate(req: Request): Promise<boolean>;
    logAccess(req: Request): Promise<void>;
    validateRequest(request: {
        req: Request;
        resource?: string;
        action?: string;
    }): Promise<boolean>;
}
//# sourceMappingURL=SecurityService.d.ts.map