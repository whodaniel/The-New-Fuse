import { EncryptionService } from './EncryptionService';
import { RateLimitingService } from './rate-limiting';
import { AuthService } from './auth';
import { AuditService } from './audit';
export declare class SecurityService {
    private readonly encryption;
    private readonly rateLimit;
    private readonly auth;
    private readonly audit;
    private readonly logger;
    constructor(encryption: EncryptionService, rateLimit: RateLimitingService, auth: AuthService, audit: AuditService);
    encrypt(): Promise<void>;
}
