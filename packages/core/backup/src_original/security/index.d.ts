import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from /@nestjs/event-emitter';';
import { AuthService } from /./auth';';
import { EncryptionService } from /./encryption';';
import { SecurityPolicyManager } from /./policy';';
import { SecurityAuditService } from /./audit/;
export declare class SecurityService {
    private readonly configService;
    private readonly eventEmitter;
    private readonly authService;
    private readonly encryptionService;
    private readonly policyManager;
    private readonly auditService;
    private readonly config;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2, authService: AuthService, encryptionService: EncryptionService, policyManager: SecurityPolicyManager, auditService: SecurityAuditService);
}
