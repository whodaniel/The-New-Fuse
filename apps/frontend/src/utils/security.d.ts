import { SecurityPolicy, SecurityCheckResult, Message } from '../types/security.js';
export declare class SecurityGuard {
    private policy;
    private readonly allowedPatterns;
    private readonly blockedPatterns;
    constructor(policy?: SecurityPolicy);
    checkMessage(message: Message): SecurityCheckResult;
    private calculateMessageSize;
    private containsSensitiveData;
    updatePolicy(newPolicy: SecurityPolicy): void;
    getPolicy(): SecurityPolicy;
}
export declare const SecurityPolicies: {
    HIGH: SecurityPolicy;
    MEDIUM: SecurityPolicy;
    LOW: SecurityPolicy;
};
