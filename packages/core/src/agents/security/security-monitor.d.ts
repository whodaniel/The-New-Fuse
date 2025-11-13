import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../monitoring/MetricsService';
export interface SecurityThreat {
    id: string;
    type: 'brute_force' | 'sql_injection' | 'xss' | 'csrf' | 'malware' | 'ddos' | 'suspicious_activity' | 'data_breach' | 'privilege_escalation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source_ip: string;
    target_resource: string;
    description: string;
    evidence: Record<string, any>;
    indicators: string[];
    status: 'detected' | 'investigating' | 'mitigated' | 'resolved' | 'false_positive';
    detected_at: Date;
    updated_at: Date;
    resolved_at?: Date;
    response_actions: SecurityAction[];
}
export interface SecurityAction {
    id: string;
    threat_id: string;
    action_type: 'block_ip' | 'rate_limit' | 'quarantine_user' | 'disable_account' | 'alert_admin' | 'log_event' | 'backup_data';
    description: string;
    parameters: Record<string, any>;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    executed_at?: Date;
    result?: Record<string, any>;
    created_at: Date;
}
export interface SecurityRule {
    id: string;
    name: string;
    description: string;
    rule_type: 'rate_limit' | 'pattern_match' | 'anomaly_detection' | 'geo_restriction' | 'time_restriction';
    conditions: Record<string, any>;
    actions: string[];
    severity: SecurityThreat['severity'];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface SecurityAlert {
    id: string;
    threat_id: string;
    alert_type: 'email' | 'sms' | 'webhook' | 'dashboard' | 'slack';
    recipient: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sent_at?: Date;
    delivered_at?: Date;
    created_at: Date;
}
export interface SecurityMetrics {
    total_threats: number;
    active_threats: number;
    resolved_threats: number;
    false_positives: number;
    blocked_ips: number;
    quarantined_users: number;
    alerts_sent: number;
    response_time_avg_ms: number;
    detection_accuracy: number;
    last_scan: Date;
    system_health_score: number;
}
export interface VulnerabilityAssessment {
    id: string;
    assessment_type: 'automated' | 'manual' | 'penetration_test';
    target_system: string;
    vulnerabilities: {
        id: string;
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        cvss_score?: number;
        cve_id?: string;
        affected_components: string[];
        remediation_steps: string[];
        status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
    }[];
    scan_results: Record<string, any>;
    recommendations: string[];
    risk_score: number;
    completed_at: Date;
    next_assessment_due: Date;
}
export interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
    affected_systems: string[];
    threat_ids: string[];
    impact_assessment: {
        data_compromised: boolean;
        systems_affected: number;
        users_impacted: number;
        business_impact: string;
        estimated_cost: number;
    };
    timeline: {
        detected_at: Date;
        reported_at: Date;
        investigation_started_at?: Date;
        contained_at?: Date;
        resolved_at?: Date;
        post_mortem_completed_at?: Date;
    };
    assigned_to: string;
    stakeholders: string[];
    communications: {
        id: string;
        message: string;
        sender: string;
        timestamp: Date;
        audience: string[];
    }[];
    lessons_learned: string[];
    created_at: Date;
    updated_at: Date;
}
export declare class SecurityMonitorAgent {
    private readonly logger;
    private readonly metricsService;
    private threats;
    private securityRules;
    private securityActions;
    private securityAlerts;
    private vulnerabilityAssessments;
    private securityIncidents;
    private blockedIPs;
    private quarantinedUsers;
    private isInitialized;
    private metrics;
    constructor(logger: LoggingService, metricsService: MetricsService);
    private initializeMetrics;
    private initializeDefaultRules;
    initialize(): Promise<void>;
    detectThreat(type: SecurityThreat['type'], sourceIP: string, targetResource: string, evidence: Record<string, any>, severity?: SecurityThreat['severity']): Promise<SecurityThreat>;
    catch(error: any): boolean;
}
//# sourceMappingURL=security-monitor.d.ts.map