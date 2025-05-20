export interface TokenPayload {
  userId: string;
  role?: string;
  permissions?: string[];
  expiresAt?: number;
  [key: string]: any;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDuration: number;
}
export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  maxFailedAttempts: number;
  lockoutDuration: number;
  passwordStrengthMinScore: number;
}
export declare class SecurityService {
  private config;
  constructor(config?: Partial<SecurityConfig>);
  checkRateLimit(ip: string): boolean;
  trackFailedAttempt(identifier: string): {
    isLocked: boolean;
    remainingAttempts: number;
  };
  private lockAccount;
  isAccountLocked(identifier: string): {
    locked: boolean;
    remainingTime?: number;
  };
  calculatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  };
  generateCSRFToken(): string;
  validateSession(session: unknown): boolean;
  resetSecurityState(identifier: string): void;
  validateToken(token: string): Promise<boolean>;
  generateToken(payload: TokenPayload): Promise<string>;
}
export declare const securityService: SecurityService;
