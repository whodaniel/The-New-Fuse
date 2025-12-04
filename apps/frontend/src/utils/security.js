var HIGH_SECURITY_POLICY = {
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
var MEDIUM_SECURITY_POLICY = {
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
var LOW_SECURITY_POLICY = {
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
var SecurityGuard = /** @class */ (function () {
    function SecurityGuard(policy) {
        if (policy === void 0) { policy = MEDIUM_SECURITY_POLICY; }
        this.policy = policy;
        this.allowedPatterns = this.policy.allowedPatterns.map(function (p) { return new RegExp(p); });
        this.blockedPatterns = this.policy.blockedPatterns.map(function (p) { return new RegExp(p); });
    }
    SecurityGuard.prototype.checkMessage = function (message) {
        var results = {
            passed: true,
            threats: [],
            details: {}
        };
        var messageSize = this.calculateMessageSize(message);
        if (messageSize > this.policy.maxMessageSize) {
            results.passed = false;
            results.details.size = {
                current: messageSize,
                max: this.policy.maxMessageSize
            };
        }
        for (var _i = 0, _a = this.blockedPatterns; _i < _a.length; _i++) {
            var pattern = _a[_i];
            var matches = message.content.match(pattern);
            if (matches) {
                results.passed = false;
                results.threats.push(ThreatType.INJECTION);
                results.details.blockedPattern = {
                    pattern: pattern.toString(),
                    matches: matches
                };
            }
        }
        var allowedMatch = false;
        for (var _b = 0, _c = this.allowedPatterns; _b < _c.length; _b++) {
            var pattern = _c[_b];
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
    };
    SecurityGuard.prototype.calculateMessageSize = function (obj) {
        return new TextEncoder().encode(JSON.stringify(obj)).length;
    };
    SecurityGuard.prototype.containsSensitiveData = function (content) {
        var sensitivePatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/,
            /\b[A-Z]{2}\d{6}\b/,
            /\b\d{16}\b/,
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
            /\b(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/
        ];
        return sensitivePatterns.some(function (pattern) { return pattern.test(content); });
    };
    SecurityGuard.prototype.updatePolicy = function (newPolicy) {
        var _a, _b;
        this.policy = newPolicy;
        this.allowedPatterns.length = 0;
        this.blockedPatterns.length = 0;
        (_a = this.allowedPatterns).push.apply(_a, newPolicy.allowedPatterns.map(function (p) { return new RegExp(p); }));
        (_b = this.blockedPatterns).push.apply(_b, newPolicy.blockedPatterns.map(function (p) { return new RegExp(p); }));
    };
    SecurityGuard.prototype.getPolicy = function () {
        return Object.assign({}, this.policy);
    };
    return SecurityGuard;
}());
export { SecurityGuard };
export var SecurityPolicies = {
    HIGH: HIGH_SECURITY_POLICY,
    MEDIUM: MEDIUM_SECURITY_POLICY,
    LOW: LOW_SECURITY_POLICY
};
