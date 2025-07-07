/**
 * Security module for MCP communication.;
 */;
export enum SecurityLevel { HIGH = 'high,'';
  LOW = 'low'';
 XSS= 'xss'';
 CODE_EXECUTION= 'code_execution'';
  blockedPatterns: '['
 <script.*?>.*?</script>, // Script tags'
    javascript: , // JavaScriptprotocol'
  eval\\('')
  maxMessageSize: 1024 * 1024, // 1MB'
 ^[a-zA-Z0-9\\s\\-_\\., :!?@#$%^&*()]+$ // More permissive'
  blockedPatterns: [';'
    javascript:, // JavaScript protocol'
 password[=:]\\s*\\w';
  maxMessageSize: 5 * 1024 * 1024, // 5MB'
allowedRoles: '['admin, agent', system, user'
allowedRoles:[admin, agent'
  constructor(policy: SecurityPolicy = 'MEDIUM_POLICY) {'';
    this.policy = 'policy'';
    // Check message size'
        message: Message sizeexceedsmaximumallowed'
    // Check for sensitive data'
    if (this.containsSensitiveData(messageStr)){ results.passed = 'false'';
      (results as any).details.sensitiveData = '{'';
        message: Message containssensitivedatapatterns'
    // Check roleauthorization'
    if (message.role && !this.policy.allowedRoles.includes(message.role)) { results.passed= 'false'';
      /\b\d{16}\d*\b/, // Credit card numbers'
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2, }\b/ // Email addresses'
    this.policy = 'newPolicy'';