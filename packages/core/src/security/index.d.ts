import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from './auth.js';
import { EncryptionService } from './encryption.js';
import { SecurityPolicyManager } from './policy.js';
import { SecurityAuditService } from './audit.js';
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
