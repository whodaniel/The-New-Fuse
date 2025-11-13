import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../monitoring/MetricsService';
export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
    conditions?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    parent_roles: string[];
    is_system_role: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    metadata: Record<string, any>;
}
export interface UserRoleAssignment {
    id: string;
    user_id: string;
    role_id: string;
    granted_by: string;
    granted_at: Date;
    expires_at?: Date;
    is_active: boolean;
    conditions?: Record<string, any>;
    metadata: Record<string, any>;
}
export interface AccessPolicy {
    id: string;
    name: string;
    description: string;
    resource_pattern: string;
    rules: {
        allow: boolean;
        conditions: Record<string, any>;
        priority: number;
        effect: 'allow' | 'deny';
    }[];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface AuthorizationRequest {
    user_id: string;
    resource: string;
    action: string;
    context: Record<string, any>;
    timestamp: Date;
}
export interface AuthorizationDecision {
    id: string;
    request: AuthorizationRequest;
    decision: 'allow' | 'deny';
    reasons: string[];
    applicable_policies: string[];
    applicable_roles: string[];
    applicable_permissions: string[];
    decision_time_ms: number;
    decided_at: Date;
}
export interface AccessAuditLog {
    id: string;
    user_id: string;
    resource: string;
    action: string;
    decision: 'allow' | 'deny';
    ip_address: string;
    user_agent: string;
    session_id?: string;
    context: Record<string, any>;
    timestamp: Date;
}
export interface AuthorizationStatistics {
    total_requests: number;
    allowed_requests: number;
    denied_requests: number;
    policy_evaluations: number;
    role_assignments: number;
    active_permissions: number;
    cache_hits: number;
    cache_misses: number;
    average_decision_time_ms: number;
    last_updated: Date;
}
export declare class AuthorizationManagerAgent {
    private readonly logger;
    private readonly metricsService;
    private permissions;
    private roles;
    private userRoleAssignments;
    private accessPolicies;
    private authorizationDecisions;
    private accessAuditLogs;
    private decisionCache;
    private isInitialized;
    private statistics;
    constructor(logger: LoggingService, metricsService: MetricsService);
    private initializeStatistics;
    private initializeSystemRolesAndPermissions;
    initialize(): Promise<void>;
    checkAuthorization(request: AuthorizationRequest): Promise<AuthorizationDecision>;
}
//# sourceMappingURL=authorization-manager.d.ts.map