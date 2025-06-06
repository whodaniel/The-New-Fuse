import { EncryptionService } from './EncryptionService.js';
import { RateLimitingService } from './rate-limiting.js';
import { AuthService } from './auth.js';
import { AuditService } from './audit.js';
export declare class SecurityService {
    private readonly encryption;
    private readonly rateLimit;
    private readonly auth;
    private readonly audit;
    private readonly logger;
    constructor(encryption: EncryptionService, rateLimit: RateLimitingService, auth: AuthService, audit: AuditService);
    encrypt(): Promise<void>;
}
