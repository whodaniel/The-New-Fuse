/**
 * Edge Worker Authentication & Authorization Middleware
 *
 * This module provides:
 * 1. JWT token validation
 * 2. API key authentication
 * 3. Tier-based access control
 * 4. Invite code validation
 * 5. Rate limiting based on subscription tier
 */

// =====================================================
// TYPES
// =====================================================

export interface AuthContext {
  userId: string;
  email: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  apiKey?: string;
  inviteCode?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  aiTokensPerDay: number;
  browserRequestsPerDay: number;
  storageMB: number;
}

// =====================================================
// TIER CONFIGURATIONS
// =====================================================

export const TIER_LIMITS: Record<string, RateLimitConfig> = {
  FREE: {
    requestsPerMinute: 10,
    requestsPerDay: 100,
    aiTokensPerDay: 10000,
    browserRequestsPerDay: 10,
    storageMB: 100,
  },
  PRO: {
    requestsPerMinute: 60,
    requestsPerDay: 10000,
    aiTokensPerDay: 1000000,
    browserRequestsPerDay: 1000,
    storageMB: 10000,
  },
  ENTERPRISE: {
    requestsPerMinute: 1000,
    requestsPerDay: 1000000,
    aiTokensPerDay: 10000000,
    browserRequestsPerDay: 100000,
    storageMB: 1000000,
  },
};

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

export class EdgeAuth {
  constructor(private env: any) {}

  /**
   * Validate JWT token from Authorization header
   */
  async validateToken(token: string): Promise<AuthContext | null> {
    try {
      // In production, verify JWT signature using JWT_SECRET
      // For now, decode and validate structure
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));

      // Validate required fields
      if (!payload.userId || !payload.email || !payload.tier) {
        return null;
      }

      // Check token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      // Verify user exists in D1 database
      const user = await this.env.DB.prepare('SELECT id, email, tier FROM users WHERE id = ?')
        .bind(payload.userId)
        .first();

      if (!user) return null;

      return {
        userId: user.id as string,
        email: user.email as string,
        tier: user.tier as 'FREE' | 'PRO' | 'ENTERPRISE',
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Validate API key from X-API-Key header
   */
  async validateApiKey(apiKey: string): Promise<AuthContext | null> {
    try {
      // Look up API key in D1 database
      const user = await this.env.DB.prepare('SELECT id, email, tier FROM users WHERE api_key = ?')
        .bind(apiKey)
        .first();

      if (!user) return null;

      return {
        userId: user.id as string,
        email: user.email as string,
        tier: user.tier as 'FREE' | 'PRO' | 'ENTERPRISE',
        apiKey,
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  /**
   * Validate invite code
   */
  async validateInviteCode(code: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const invite = await this.env.DB.prepare(
        'SELECT code, is_used, used_by FROM invite_codes WHERE code = ?'
      )
        .bind(code)
        .first();

      if (!invite) {
        return { valid: false };
      }

      if (invite.is_used) {
        return { valid: false };
      }

      return { valid: true };
    } catch (error) {
      console.error('Invite code validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Check if user has required invite code for agent registration
   */
  async requireInviteCode(userId: string): Promise<boolean> {
    try {
      // Check if user has used an invite code
      const result = await this.env.DB.prepare('SELECT 1 FROM invite_codes WHERE used_by = ?')
        .bind(userId)
        .first();

      return !!result;
    } catch (error) {
      console.error('Invite code check error:', error);
      return false;
    }
  }

  /**
   * Main authentication middleware
   */
  async authenticate(request: Request): Promise<AuthContext | null> {
    // Try JWT token first
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const context = await this.validateToken(token);
      if (context) return context;
    }

    // Try API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey) {
      const context = await this.validateApiKey(apiKey);
      if (context) return context;
    }

    return null;
  }
}

// =====================================================
// RATE LIMITING
// =====================================================

export class EdgeRateLimiter {
  constructor(private env: any) {}

  /**
   * Check rate limits for a user
   */
  async checkRateLimit(
    userId: string,
    tier: string,
    service: 'ai' | 'browser' | 'storage' | 'general'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
    const today = new Date().toISOString().split('T')[0];

    // Get current usage
    const usage = await this.env.DB.prepare(
      'SELECT count FROM daily_usage WHERE user_id = ? AND date = ? AND service = ?'
    )
      .bind(userId, today, service)
      .first();

    const currentCount = (usage?.count as number) || 0;

    // Check limits based on service
    switch (service) {
      case 'ai':
        if (currentCount >= limits.aiTokensPerDay) {
          return { allowed: false, reason: 'Daily AI token limit exceeded' };
        }
        break;
      case 'browser':
        if (currentCount >= limits.browserRequestsPerDay) {
          return { allowed: false, reason: 'Daily browser request limit exceeded' };
        }
        break;
      case 'storage':
        if (currentCount >= limits.storageMB) {
          return { allowed: false, reason: 'Storage limit exceeded' };
        }
        break;
      case 'general':
        if (currentCount >= limits.requestsPerDay) {
          return { allowed: false, reason: 'Daily request limit exceeded' };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Record usage
   */
  async recordUsage(
    userId: string,
    service: 'ai' | 'browser' | 'storage' | 'general',
    amount: number = 1
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.env.DB.prepare(
      `
      INSERT INTO daily_usage (user_id, date, service, count)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, date, service) DO UPDATE SET
        count = count + ?
    `
    )
      .bind(userId, today, service, amount, amount)
      .run();
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<{
    today: Record<string, number>;
    tier: string;
    limits: RateLimitConfig;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const user = await this.env.DB.prepare('SELECT tier FROM users WHERE id = ?')
      .bind(userId)
      .first();

    const tier = (user?.tier as string) || 'FREE';
    const limits = TIER_LIMITS[tier];

    const usage = await this.env.DB.prepare(
      'SELECT service, count FROM daily_usage WHERE user_id = ? AND date = ?'
    )
      .bind(userId, today)
      .all();

    const todayUsage: Record<string, number> = {};
    for (const row of usage.results || []) {
      todayUsage[row.service] = row.count;
    }

    return {
      today: todayUsage,
      tier,
      limits,
    };
  }
}

// =====================================================
// TIER-BASED ACCESS CONTROL
// =====================================================

export class EdgeAccessControl {
  /**
   * Check if user can access a specific skill/tool
   */
  static canAccessSkill(tier: string, skillName: string): boolean {
    const freeSkills = ['ai_inference', 'remember', 'recall'];

    const proSkills = [
      ...freeSkills,
      'browser_scrape',
      'browser_screenshot',
      'research_topic',
      'generate_report',
    ];

    const enterpriseSkills = [
      ...proSkills,
      // Add enterprise-only skills here
    ];

    switch (tier) {
      case 'FREE':
        return freeSkills.includes(skillName);
      case 'PRO':
        return proSkills.includes(skillName);
      case 'ENTERPRISE':
        return enterpriseSkills.includes(skillName);
      default:
        return false;
    }
  }

  /**
   * Get available skills for a tier
   */
  static getAvailableSkills(tier: string): string[] {
    const allSkills = [
      'ai_inference',
      'remember',
      'recall',
      'browser_scrape',
      'browser_screenshot',
      'research_topic',
      'generate_report',
    ];

    return allSkills.filter((skill) => this.canAccessSkill(tier, skill));
  }

  /**
   * Check if user can register an agent (requires invite code)
   */
  static canRegisterAgent(hasInviteCode: boolean): boolean {
    return hasInviteCode;
  }
}

// =====================================================
// ERROR RESPONSES
// =====================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function createErrorResponse(error: AuthError): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code,
    }),
    {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract auth context from request
 */
export async function getAuthContext(request: Request, env: any): Promise<AuthContext> {
  const auth = new EdgeAuth(env);
  const context = await auth.authenticate(request);

  if (!context) {
    throw new AuthError(
      'Authentication required. Please provide a valid JWT token or API key.',
      401,
      'UNAUTHORIZED'
    );
  }

  return context;
}

/**
 * Check rate limits and throw if exceeded
 */
export async function checkRateLimitOrThrow(
  userId: string,
  tier: string,
  service: 'ai' | 'browser' | 'storage' | 'general',
  env: any
): Promise<void> {
  const rateLimiter = new EdgeRateLimiter(env);
  const result = await rateLimiter.checkRateLimit(userId, tier, service);

  if (!result.allowed) {
    throw new AuthError(result.reason || 'Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Check skill access and throw if not allowed
 */
export function checkSkillAccessOrThrow(tier: string, skillName: string): void {
  if (!EdgeAccessControl.canAccessSkill(tier, skillName)) {
    throw new AuthError(
      `Skill "${skillName}" requires a higher subscription tier. Current tier: ${tier}`,
      403,
      'INSUFFICIENT_TIER'
    );
  }
}

/**
 * Check invite code requirement for agent registration
 */
export async function checkInviteCodeOrThrow(userId: string, env: any): Promise<void> {
  const auth = new EdgeAuth(env);
  const hasInviteCode = await auth.requireInviteCode(userId);

  if (!hasInviteCode) {
    throw new AuthError(
      'Agent registration requires a valid invite code. Please contact support.',
      403,
      'INVITE_CODE_REQUIRED'
    );
  }
}
