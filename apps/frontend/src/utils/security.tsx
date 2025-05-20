const HIGH_SECURITY_POLICY = {
    level: SecurityLevel.HIGH,
    maxMessageSize: 1024 * 1024,
    allowedPatterns: [
        '^[a-zA-Z0-9\\s\\-_\\.]+$',
        '^\\{.*\\}$'
    ],
    blockedPatterns: [
        '(?:<[^>]*script)|javascript:|data:|about:|vbscript:',
        '(?:SELECT|INSERT|UPDATE|DELETE|DROP).*(?:FROM|INTO|TABLE)'
    ],
    requireAuthentication: true,
    requireEncryption: true,
    allowedRoles: ['admin', 'superuser']
};
const MEDIUM_SECURITY_POLICY = {
    level: SecurityLevel.MEDIUM,
    maxMessageSize: 5 * 1024 * 1024,
    allowedPatterns: [
        '^[\\w\\s\\-_\\.,;:!?\\"\\\'][\\]\\{\\}()]+$'
    ],
    blockedPatterns: [
        '<script[^>]*>',
        'javascript:'
    ],
    requireAuthentication: true,
    requireEncryption: false,
    allowedRoles: ['admin', 'user', 'guest']
};
const LOW_SECURITY_POLICY = {
    level: SecurityLevel.LOW,
    maxMessageSize: 10 * 1024 * 1024,
    allowedPatterns: [],
    blockedPatterns: [
        '<script[^>]*>'
    ],
    requireAuthentication: false,
    requireEncryption: false,
    allowedRoles: ['*']
};
export class SecurityGuard {
    constructor(policy = MEDIUM_SECURITY_POLICY) {
        this.policy = policy;
        this.allowedPatterns = this.policy.allowedPatterns.map(p => new RegExp(p));
        this.blockedPatterns = this.policy.blockedPatterns.map(p => new RegExp(p));
    }
    checkMessage(message) {
        const results = {
            passed: true,
            threats: [],
            details: {}
        };
        const messageSize = this.calculateMessageSize(message);
        if (messageSize > this.policy.maxMessageSize) {
            results.passed = false;
            results.details.size = {
                current: messageSize,
                max: this.policy.maxMessageSize
            };
        }
        for (const pattern of this.blockedPatterns) {
            const matches = message.content.match(pattern);
            if (matches) {
                results.passed = false;
                results.threats.push(ThreatType.INJECTION);
                results.details.blockedPattern = {
                    pattern: pattern.toString(),
                    matches: matches
                };
            }
        }
        let allowedMatch = false;
        for (const pattern of this.allowedPatterns) {
            if (pattern.test(message.content)) {
                allowedMatch = true;
                break;
            }
        }
        if (!allowedMatch && this.allowedPatterns.length > 0) {
            results.passed = false;
            results.details.allowedPattern = {
                required: this.policy.allowedPatterns,
                found: []
            };
        }
        if (this.containsSensitiveData(message.content)) {
            results.passed = false;
            results.threats.push(ThreatType.SENSITIVE_DATA);
            results.details.sensitiveData = {
                type: 'PII',
                location: 'message.content'
            };
        }
        if (this.policy.requireAuthentication && !message.authenticated) {
            results.passed = false;
            results.threats.push(ThreatType.AUTH_BYPASS);
            results.details.authentication = {
                required: true,
                provided: false
            };
        }
        if (this.policy.requireEncryption && !message.encrypted) {
            results.passed = false;
            results.details.encryption = {
                required: true,
                provided: false
            };
        }
        if (message.role && !this.policy.allowedRoles.includes(message.role)) {
            results.passed = false;
            results.details.authorization = {
                role: message.role,
                allowed: this.policy.allowedRoles
            };
        }
        return results;
    }
    calculateMessageSize(obj) {
        return new TextEncoder().encode(JSON.stringify(obj)).length;
    }
    containsSensitiveData(content) {
        const sensitivePatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/,
            /\b[A-Z]{2}\d{6}\b/,
            /\b\d{16}\b/,
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
            /\b(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/
        ];
        return sensitivePatterns.some(pattern => pattern.test(content));
    }
    updatePolicy(newPolicy) {
        this.policy = newPolicy;
        this.allowedPatterns.length = 0;
        this.blockedPatterns.length = 0;
        this.allowedPatterns.push(...newPolicy.allowedPatterns.map(p => new RegExp(p)));
        this.blockedPatterns.push(...newPolicy.blockedPatterns.map(p => new RegExp(p)));
    }
    getPolicy() {
        return Object.assign({}, this.policy);
    }
}
export const SecurityPolicies = {
    HIGH: HIGH_SECURITY_POLICY,
    MEDIUM: MEDIUM_SECURITY_POLICY,
    LOW: LOW_SECURITY_POLICY
};
//# sourceMappingURL=security.js.map