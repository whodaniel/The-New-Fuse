import { LRUCache } from '../config/lru_cache.js';
import { TimeSpan } from '../config/timedelta.js';
import { logger } from '../config/logging_config.js';

// Rate limiting cache
const rateLimitCache: LRUCache<string, number> = new LRUCache<string, number>(
  1000,
); // Store up to 1000 IP addresses
const failedAttemptsCache: {
  maxRequests: number;
  windowMs: number;
  blockDuration: number;
} = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDuration: 60 * 60 * 1000, // 1 hour
};
const lockoutCache: {
  [key: string]: number;
} = {};

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  maxFailedAttempts: number;
  lockoutDuration: number;
  passwordStrengthMinScore: number;
}

const DEFAULT_CONFIG: SecurityConfig = {
  rateLimit: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
  },
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordStrengthMinScore: 3,
};

export class SecurityService {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Rate limiting
  checkRateLimit(ip: string): boolean {
    const key = `rate_${ip}`;
    const requests = rateLimitCache.get(key) || 0;

    if (requests >= this.config.rateLimit.maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return false;
    }

    rateLimitCache.set(key, requests + 1, new TimeSpan(0, 0, 15));
    return true;
  }

  // Account locking
  private lockAccount(identifier: string): void {
    lockoutCache[identifier] = Date.now() + this.config.lockoutDuration;
  }

  isAccountLocked(identifier: string): {
    isLocked: boolean;
    remainingAttempts: number;
  } {
    const lockoutEnd = lockoutCache[identifier];

    if (!lockoutEnd) {
      return {
        isLocked: false,
        remainingAttempts: this.config.maxFailedAttempts,
      };
    }

    const now = Date.now();

    if (lockoutEnd <= now) {
      this.unlockAccount(identifier);
      return {
        isLocked: false,
        remainingAttempts: this.config.maxFailedAttempts,
      };
    }

    return {
      isLocked: true,
      remainingAttempts: 0,
    };
  }

  unlockAccount(identifier: string): void {
    lockoutCache[identifier] = undefined;
    failedAttemptsCache[identifier] = 0;
    rateLimitCache.delete(`rate_${identifier}`);
  }

  incrementFailedAttempts(identifier: string): {
    isLocked: boolean;
    remainingAttempts: number;
  } {
    failedAttemptsCache[identifier] =
      (failedAttemptsCache[identifier] || 0) + 1;

    if (failedAttemptsCache[identifier] > this.config.maxFailedAttempts) {
      this.lockAccount(identifier);
      return { isLocked: true, remainingAttempts: 0 };
    }

    return {
      isLocked: false,
      remainingAttempts:
        this.config.maxFailedAttempts - failedAttemptsCache[identifier],
    };
  }

  resetFailedAttempts(identifier: string): void {
    failedAttemptsCache[identifier] = 0;
  }

  validatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Password should be at least 8 characters long");
    }

    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Add uppercase letters");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Add lowercase letters");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Add numbers");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("Add special characters");

    // Pattern checks
    if (/(.)1{2,}/.test(password)) {
      score -= 1;
      feedback.push("Avoid repeated characters");
    }

    if (
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
        password,
      )
    ) {
      score += 1;
    }

    const normalizedScore = Math.max(0, Math.min(5, score));

    return {
      score: normalizedScore,
      feedback: feedback,
      isStrong: normalizedScore >= this.config.passwordStrengthMinScore,
    };
  }

  // CSRF token generation
  generateCSRFToken(): string {
    return crypto.randomUUID();
  }

  // Session management
  createSession(identifier: string): string {
    const session = {
      identifier,
      createdAt: Date.now(),
    };
    return this.jwtService.sign(session);
  }

  verifySession(token: string): boolean {
    try {
      const decoded = this.jwtService.verify(token);
      return !!decoded;
    } catch {
      return false;
    }
  }

  async generateToken(payload: unknown): Promise<string> {
    return this.jwtService.sign(payload);
  }

  isSessionValid(token: string): boolean {
    if (!token) return false;

    try {
      const decoded = this.jwtService.verify(token) as any;
      const session = decoded as { identifier: string; createdAt: number };

      if (!session) return false;

      const now = Date.now();
      if (session.createdAt && now - session.createdAt > 24 * 60 * 60 * 1000) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Reset all security caches
  resetSecurityState(): void {
    for (const key in lockoutCache) {
      delete lockoutCache[key];
    }
    for (const key in failedAttemptsCache) {
      delete failedAttemptsCache[key];
    }
    rateLimitCache.clear();
  }
}
