"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationManagerAgent = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
const MetricsService_1 = require("../../monitoring/MetricsService");
let AuthenticationManagerAgent = class AuthenticationManagerAgent {
    logger;
    metricsService;
    credentials = new Map();
    sessions = new Map();
    attempts = [];
    mfaChallenges = new Map();
    policies = new Map();
    isInitialized = false;
    statistics;
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
        this.statistics = this.initializeStatistics();
        this.initializeDefaultPolicies();
    }
    initializeStatistics() {
        return {
            total_attempts: 0,
            successful_attempts: 0,
            failed_attempts: 0,
            suspicious_attempts: 0,
            active_sessions: 0,
            unique_users: 0,
            mfa_challenges_issued: 0,
            mfa_challenges_completed: 0,
            policy_violations: 0,
            last_updated: new Date()
        };
    }
    initializeDefaultPolicies() {
        const defaultPolicy = {
            id: 'default-auth-policy',
            name: 'Default Authentication Policy',
            description: 'Standard authentication requirements for all users',
            rules: {
                password_requirements: {
                    min_length: 12,
                    require_uppercase: true,
                    require_lowercase: true,
                    require_numbers: true,
                    require_symbols: true,
                    max_age_days: 90,
                    prevent_reuse_count: 5
                },
                session_management: {
                    max_session_duration: 8 * 60 * 60 * 1000, // 8 hours
                    max_concurrent_sessions: 3,
                    idle_timeout: 30 * 60 * 1000, // 30 minutes
                    require_device_registration: false
                },
                mfa_requirements: {
                    required_for_all: false,
                    required_for_admin: true,
                    required_for_sensitive_operations: true,
                    allowed_methods: ['totp', 'sms', 'email', 'push']
                },
                access_restrictions: {
                    allowed_ip_ranges: [],
                    blocked_countries: [],
                    allowed_hours: [],
                    max_failed_attempts: 5,
                    lockout_duration: 15 * 60 * 1000 // 15 minutes
                }
            },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.policies.set(defaultPolicy.id, defaultPolicy);
    }
    async initialize() {
        try {
            this.logger.log('Initializing Authentication Manager Agent...', 'AuthenticationManagerAgent');
            // Start cleanup intervals
            this.startSessionCleanup();
            this.startChallengeCleanup();
            this.startStatisticsUpdate();
            this.isInitialized = true;
            this.logger.log('Authentication Manager Agent initialized successfully', 'AuthenticationManagerAgent');
            await this.metricsService.recordMetric('authentication_manager_initialized', 1, 'counter', { labels: { component: 'authentication_manager' } });
        }
        catch (error) {
            this.logger.error('Failed to initialize Authentication Manager Agent', error instanceof Error ? error : new Error(String(error)), 'AuthenticationManagerAgent');
            throw error;
        }
    }
    async authenticateUser(identifier, credential, credentialType, context) {
        try {
            const attempt = {
                id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
        username: identifier,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        success: false,
        authentication_method: credentialType,
        device_fingerprint: context.device_fingerprint,
        attempted_at: new Date(),
        security_flags: {
          is_suspicious: false,
          is_brute_force: false,
          is_from_known_location: true,
          risk_score: 0
        }
      };

      // Check for brute force attempts
      const recentAttempts = this.getRecentFailedAttempts(context.ip_address, 15 * 60 * 1000); // 15 minutes
      if (recentAttempts.length >= 5) {
        attempt.security_flags.is_brute_force = true;
        attempt.security_flags.risk_score += 50;
        attempt.failure_reason = 'Too many failed attempts';
        this.attempts.push(attempt);
        this.statistics.failed_attempts++;
        this.statistics.total_attempts++;
        this.statistics.suspicious_attempts++;
        return { success: false };
      }

      // Find matching credential
      const userCredential = Array.from(this.credentials.values()).find(
        cred => cred.credential_type === credentialType && 
                cred.is_active && 
                (!cred.expires_at || cred.expires_at > new Date())
      );

      if (!userCredential || !this.verifyCredential(userCredential, credential)) {
        attempt.failure_reason = 'Invalid credentials';
        this.attempts.push(attempt);
        this.statistics.failed_attempts++;
        this.statistics.total_attempts++;
        return { success: false };
      }

      attempt.user_id = userCredential.user_id;
      attempt.success = true;

      // Check if MFA is required
      const requiresMFA = await this.checkMFARequirement(userCredential.user_id, context);
      if (requiresMFA) {
        const challenge = await this.createMFAChallenge(userCredential.user_id, 'totp');
        this.attempts.push(attempt);
        this.statistics.total_attempts++;
        this.statistics.successful_attempts++;
        return { success: true, mfa_required: true, challenge_id: challenge.id };
      }

      // Create session
      const session = await this.createSession(userCredential.user_id, context);
      
      // Update credential last used
      userCredential.last_used_at = new Date();
      this.credentials.set(userCredential.id, userCredential);

      this.attempts.push(attempt);
      this.statistics.total_attempts++;
      this.statistics.successful_attempts++;

      await this.metricsService.recordMetric('authentication_success', 1, 'counter', { labels: { method: credentialType } });
      
      return { success: true, session };
    } catch (error) {
      this.logger.error('Failed to authenticate user', error instanceof Error ? error : new Error(String(error)), 'AuthenticationManagerAgent');
      this.statistics.failed_attempts++;
      this.statistics.total_attempts++;
      return { success: false };
    }
  }

  async createMFAChallenge(userId: string, challengeType: MFAChallenge['challenge_type']): Promise<MFAChallenge> {
    const challenge: MFAChallenge = {`,
                id: mfa_$
            }, { Date, now };
            ();
        }
        finally { }
        `_${Math.random().toString(36).substr(2, 9)}`,
            user_id;
        userId,
            challenge_type;
        challengeType,
            challenge_data;
        this.generateChallengeData(challengeType),
            expires_at;
        new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts_count;
        0,
            max_attempts;
        3,
            is_completed;
        false,
            created_at;
        new Date();
    }
    ;
};
exports.AuthenticationManagerAgent = AuthenticationManagerAgent;
exports.AuthenticationManagerAgent = AuthenticationManagerAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService])
], AuthenticationManagerAgent);
this.mfaChallenges.set(challenge.id, challenge);
this.statistics.mfa_challenges_issued++;
await this.metricsService.recordMetric('mfa_challenge_created', 1, 'counter', { labels: { type: challengeType } });
return challenge;
async;
verifyMFAChallenge(challengeId, string, response, string);
Promise < { success: boolean, session: AuthenticationSession } > {
    try: {
        const: challenge = this.mfaChallenges.get(challengeId),
        if(, challenge) {
            return { success: false };
        },
        if(challenge) { }, : .is_completed || challenge.expires_at < new Date()
    }
};
{
    return { success: false };
}
challenge.attempts_count++;
if (challenge.attempts_count > challenge.max_attempts) {
    challenge.is_completed = true;
    this.mfaChallenges.set(challengeId, challenge);
    return { success: false };
}
const isValid = this.validateMFAResponse(challenge, response);
if (!isValid) {
    this.mfaChallenges.set(challengeId, challenge);
    return { success: false };
}
challenge.is_completed = true;
this.mfaChallenges.set(challengeId, challenge);
this.statistics.mfa_challenges_completed++;
// Create session after successful MFA
const session = await this.createSession(challenge.user_id, {
    ip_address: '0.0.0.0', // Should be passed from context
    user_agent: 'Unknown',
    device_fingerprint: 'unknown'
});
await this.metricsService.recordMetric('mfa_verification_success', 1, 'counter', { labels: { type: challenge.challenge_type } });
return { success: true, session };
try { }
catch (error) {
    this.logger.error('Failed to verify MFA challenge', error instanceof Error ? error : new Error(String(error)), 'AuthenticationManagerAgent');
    return { success: false };
}
async;
createSession(userId, string, context, {
    ip_address: string,
    user_agent: string,
    device_fingerprint: string
});
Promise < AuthenticationSession > {
    const: session, AuthenticationSession = {
        id: session_$
    }
};
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
user_id: userId,
    session_token;
this.generateSessionToken(),
    device_fingerprint;
context.device_fingerprint,
    ip_address;
context.ip_address,
    user_agent;
context.user_agent,
    is_active;
true,
    expires_at;
new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    last_activity_at;
new Date(),
    created_at;
new Date(),
    security_flags;
{
    is_suspicious: false,
        requires_mfa;
    false,
        is_elevated;
    false,
        device_trusted;
    true;
}
;
this.sessions.set(session.id, session);
this.statistics.active_sessions++;
await this.metricsService.recordMetric('session_created', 1, 'counter', { labels: { user_id: userId } });
return session;
async;
validateSession(sessionToken, string);
Promise < { valid: boolean, session: AuthenticationSession } > {
    try: {
        const: session = Array.from(this.sessions.values()).find(s => s.session_token === sessionToken),
        if(, session) { }
    } || !session.is_active || session.expires_at < new Date()
};
{
    return { valid: false };
}
// Update last activity
session.last_activity_at = new Date();
this.sessions.set(session.id, session);
return { valid: true, session };
try { }
catch (error) {
    this.logger.error('Failed to validate session', error instanceof Error ? error : new Error(String(error)), 'AuthenticationManagerAgent');
    return { valid: false };
}
async;
revokeSession(sessionId, string);
Promise < boolean > {
    try: {
        const: session = this.sessions.get(sessionId),
        if(, session) {
            return false;
        },
        session, : .is_active = false,
        this: .sessions.set(sessionId, session),
        this: .statistics.active_sessions--,
        await, this: .metricsService.recordMetric('session_revoked', 1, 'counter', { labels: { session_id: sessionId } }),
        return: true
    }, catch(error) {
        this.logger.error('Failed to revoke session', error instanceof Error ? error : new Error(String(error)), 'AuthenticationManagerAgent');
        return false;
    }
};
async;
createCredential(userId, string, credentialType, AuthenticationCredential['credential_type'], credentialData, (Record), expiresAt ?  : Date);
Promise < AuthenticationCredential > {
    const: credential, AuthenticationCredential = {} `
      id: `, cred_$
};
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
`,
      user_id: userId,
      credential_type: credentialType,
      credential_data: this.hashCredentialData(credentialData),
      is_active: true,
      expires_at: expiresAt,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {}
    };

    this.credentials.set(credential.id, credential);

    await this.metricsService.recordMetric('credential_created', 1, 'counter', { labels: { type: credentialType } });
    
    return credential;
  }

  async getAuthenticationPolicy(policyId: string): Promise<AuthenticationPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  async updateAuthenticationPolicy(policyId: string, updates: Partial<AuthenticationPolicy>): Promise<boolean> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        return false;
      }

      const updatedPolicy = { ...policy, ...updates, updated_at: new Date() };
      this.policies.set(policyId, updatedPolicy);

      await this.metricsService.recordMetric('authentication_policy_updated', 1, 'counter', { labels: { policy_id: policyId } });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to update authentication policy', error instanceof Error ? error : new Error(String(error)), 'AuthenticationManagerAgent');
      return false;
    }
  }

  async getStatistics(): Promise<AuthenticationStatistics> {
    this.updateStatistics();
    return { ...this.statistics };
  }

  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: Record<string, any> }> {
    try {
      const activeSessions = Array.from(this.sessions.values()).filter(s => s.is_active).length;
      const recentAttempts = this.attempts.filter(a => a.attempted_at > new Date(Date.now() - 60000)).length;
      const suspiciousActivity = this.attempts.filter(a => a.security_flags.is_suspicious && a.attempted_at > new Date(Date.now() - 300000)).length;

      const status = suspiciousActivity > 10 ? 'unhealthy' : 
                    recentAttempts > 100 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          active_sessions: activeSessions,
          recent_attempts: recentAttempts,
          suspicious_activity: suspiciousActivity,
          policies_count: this.policies.size,
          credentials_count: this.credentials.size,
          initialized: this.isInitialized
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private verifyCredential(credential: AuthenticationCredential, providedCredential: string): boolean {
    // In a real implementation, this would use proper password hashing comparison
    return JSON.stringify(credential.credential_data) === JSON.stringify(this.hashCredentialData({ password: providedCredential }));
  }

  private async checkMFARequirement(userId: string, context: any): Promise<boolean> {
    const defaultPolicy = this.policies.get('default-auth-policy');
    return defaultPolicy?.rules.mfa_requirements.required_for_all || false;
  }

  private generateChallengeData(challengeType: MFAChallenge['challenge_type']): Record<string, any> {
    switch (challengeType) {
      case 'totp':
        return { secret: Math.random().toString(36).substring(2, 15) };
      case 'sms':
        return { code: Math.floor(100000 + Math.random() * 900000).toString() };
      case 'email':
        return { token: Math.random().toString(36).substring(2, 15) };
      default:
        return {};
    }
  }

  private validateMFAResponse(challenge: MFAChallenge, response: string): boolean {
    // In a real implementation, this would validate against the actual challenge
    return response.length >= 6;
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private hashCredentialData(data: Record<string, any>): Record<string, any> {
    // In a real implementation, this would use proper cryptographic hashing
    return { hashed: JSON.stringify(data) };
  }

  private getRecentFailedAttempts(ipAddress: string, timeWindow: number): AuthenticationAttempt[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.attempts.filter(attempt => 
      attempt.ip_address === ipAddress && 
      !attempt.success && 
      attempt.attempted_at > cutoff
    );
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (!session.is_active || session.expires_at < now) {
          this.sessions.delete(sessionId);
          if (session.is_active) {
            this.statistics.active_sessions--;
          }
        }
      }
    }, 60000); // Every minute
  }

  private startChallengeCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [challengeId, challenge] of this.mfaChallenges.entries()) {
        if (challenge.expires_at < now || challenge.is_completed) {
          this.mfaChallenges.delete(challengeId);
        }
      }
    }, 300000); // Every 5 minutes
  }

  private startStatisticsUpdate(): void {
    setInterval(() => {
      this.updateStatistics();
    }, 60000); // Every minute
  }

  private updateStatistics(): void {
    this.statistics.active_sessions = Array.from(this.sessions.values()).filter(s => s.is_active).length;
    this.statistics.unique_users = new Set(Array.from(this.sessions.values()).map(s => s.user_id)).size;
    this.statistics.last_updated = new Date();
  }
};
//# sourceMappingURL=authentication-manager.js.map