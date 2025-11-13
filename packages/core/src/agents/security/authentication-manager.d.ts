import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../monitoring/MetricsService';
export interface AuthenticationCredential {
    id: string;
    user_id: string;
    credential_type: 'password' | 'api_key' | 'oauth_token' | 'certificate' | 'biometric' | 'mfa_device';
    credential_data: Record<string, any>;
    is_active: boolean;
    expires_at?: Date;
    last_used_at?: Date;
    created_at: Date;
    updated_at: Date;
    metadata: Record<string, any>;
}
export interface AuthenticationSession {
    id: string;
    user_id: string;
    session_token: string;
    device_fingerprint: string;
    ip_address: string;
    user_agent: string;
    is_active: boolean;
    expires_at: Date;
    last_activity_at: Date;
    created_at: Date;
    security_flags: {
        is_suspicious: boolean;
        requires_mfa: boolean;
        is_elevated: boolean;
        device_trusted: boolean;
    };
}
export interface AuthenticationAttempt {
    id: string;
    user_id?: string;
    username?: string;
    ip_address: string;
    user_agent: string;
    success: boolean;
    failure_reason?: string;
    authentication_method: string;
    device_fingerprint: string;
    attempted_at: Date;
    security_flags: {
        is_suspicious: boolean;
        is_brute_force: boolean;
        is_from_known_location: boolean;
        risk_score: number;
    };
}
export interface MFAChallenge {
    id: string;
    user_id: string;
    challenge_type: 'totp' | 'sms' | 'email' | 'push' | 'hardware_key';
    challenge_data: Record<string, any>;
    expires_at: Date;
    attempts_count: number;
    max_attempts: number;
    is_completed: boolean;
    created_at: Date;
}
export interface AuthenticationPolicy {
    id: string;
    name: string;
    description: string;
    rules: {
        password_requirements: {
            min_length: number;
            require_uppercase: boolean;
            require_lowercase: boolean;
            require_numbers: boolean;
            require_symbols: boolean;
            max_age_days: number;
            prevent_reuse_count: number;
        };
        session_management: {
            max_session_duration: number;
            max_concurrent_sessions: number;
            idle_timeout: number;
            require_device_registration: boolean;
        };
        mfa_requirements: {
            required_for_all: boolean;
            required_for_admin: boolean;
            required_for_sensitive_operations: boolean;
            allowed_methods: string[];
        };
        access_restrictions: {
            allowed_ip_ranges: string[];
            blocked_countries: string[];
            allowed_hours: {
                start: string;
                end: string;
            }[];
            max_failed_attempts: number;
            lockout_duration: number;
        };
    };
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface AuthenticationStatistics {
    total_attempts: number;
    successful_attempts: number;
    failed_attempts: number;
    suspicious_attempts: number;
    active_sessions: number;
    unique_users: number;
    mfa_challenges_issued: number;
    mfa_challenges_completed: number;
    policy_violations: number;
    last_updated: Date;
}
export declare class AuthenticationManagerAgent {
    private readonly logger;
    private readonly metricsService;
    private credentials;
    private sessions;
    private attempts;
    private mfaChallenges;
    private policies;
    private isInitialized;
    private statistics;
    constructor(logger: LoggingService, metricsService: MetricsService);
    private initializeStatistics;
    private initializeDefaultPolicies;
    initialize(): Promise<void>;
    authenticateUser(identifier: string, credential: string, credentialType: AuthenticationCredential['credential_type'], context: {
        ip_address: string;
        user_agent: string;
        device_fingerprint: string;
    }): Promise<{
        success: boolean;
        session?: AuthenticationSession;
        mfa_required?: boolean;
        challenge_id?: string;
    }>;
}
//# sourceMappingURL=authentication-manager.d.ts.map