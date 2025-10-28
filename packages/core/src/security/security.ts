/**
 * Security module for MCP communication.
 */
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum SecurityThreat {
  XSS = 'xss',
  SENSITIVE_DATA = 'sensitive_data',
  CODE_EXECUTION = 'code_execution',
}

export interface SecurityPolicy {
  level: SecurityLevel;
  allowedRoles: string[];
  maxMessageSize: number;
  blockedPatterns: RegExp[];
}

export class Security {
  private policy: SecurityPolicy;

  constructor(policy: SecurityPolicy) {
    this.policy = policy;
  }

  validateMessage(message: any): { passed: boolean; details: any } {
    const results = { passed: true, details: {} };
    const messageStr = JSON.stringify(message);

    // Check message size
    if (messageStr.length > this.policy.maxMessageSize) {
      results.passed = false;
      results.details.size = { message: 'Message size exceeds maximum allowed' };
    }

    // Check for malicious patterns
    for (const pattern of this.policy.blockedPatterns) {
      if (pattern.test(messageStr)) {
        results.passed = false;
        results.details.pattern = { message: `Blocked pattern detected: ${pattern}` };
        break;
      }
    }

    // Check for sensitive data
    if (this.containsSensitiveData(messageStr)) {
      results.passed = false;
      results.details.sensitiveData = { message: 'Message contains sensitive data patterns' };
    }

    // Check role authorization
    if (message.role && !this.policy.allowedRoles.includes(message.role)) {
      results.passed = false;
      results.details.role = { message: `Role ${message.role} is not allowed` };
    }

    return results;
  }

  private containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /\b\d{16}\b/g, // Credit card numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // Email addresses
    ];
    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  setPolicy(policy: SecurityPolicy): void {
    this.policy = policy;
  }
}
