/**
 * Environment Manager
 * Handles environment provisioning, configuration, and lifecycle management
 */
import { EnvironmentType } from '../types/infrastructure';
import { InfrastructureManager } from './InfrastructureManager';
export interface Environment {
    id: string;
    name: string;
    type: EnvironmentType;
    projectId: string;
    region: string;
    zone: string;
    infrastructureIds: string[];
    configuration: EnvironmentConfiguration;
    status: EnvironmentStatus;
    createdAt: Date;
    updatedAt: Date;
    metadata: EnvironmentMetadata;
}
export interface EnvironmentConfiguration {
    networking: NetworkConfiguration;
    security: SecurityConfiguration;
    monitoring: MonitoringConfiguration;
    backup: BackupConfiguration;
    scaling: ScalingConfiguration;
}
export interface NetworkConfiguration {
    vpcName: string;
    subnetCidr: string;
    enablePrivateGoogleAccess: boolean;
    firewallRules: FirewallRule[];
}
export interface FirewallRule {
    name: string;
    direction: 'INGRESS' | 'EGRESS';
    priority: number;
    sourceRanges?: string[];
    targetTags?: string[];
    allowed: FirewallAllowed[];
}
export interface FirewallAllowed {
    protocol: string;
    ports?: string[];
}
export interface SecurityConfiguration {
    enableOSLogin: boolean;
    requireSSL: boolean;
    enableAuditLogs: boolean;
    iamPolicies: IAMPolicy[];
}
export interface IAMPolicy {
    role: string;
    members: string[];
    condition?: IAMCondition;
}
export interface IAMCondition {
    title: string;
    description: string;
    expression: string;
}
export interface MonitoringConfiguration {
    enableStackdriverMonitoring: boolean;
    enableStackdriverLogging: boolean;
    alertPolicies: AlertPolicy[];
    dashboards: string[];
}
export interface AlertPolicy {
    displayName: string;
    conditions: AlertCondition[];
    notificationChannels: string[];
}
export interface AlertCondition {
    displayName: string;
    conditionThreshold: {
        filter: string;
        comparison: string;
        thresholdValue: number;
        duration: string;
    };
}
export interface BackupConfiguration {
    enableAutomaticBackups: boolean;
    retentionDays: number;
    backupSchedule: string;
    crossRegionBackup: boolean;
}
export interface ScalingConfiguration {
    enableAutoScaling: boolean;
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
    scaleInCooldown: number;
    scaleOutCooldown: number;
}
export declare enum EnvironmentStatus {
    CREATING = "creating",
    ACTIVE = "active",
    UPDATING = "updating",
    DELETING = "deleting",
    DELETED = "deleted",
    ERROR = "error"
}
export interface EnvironmentMetadata {
    owner: string;
    team: string;
    costCenter: string;
    tags: Record<string, string>;
    compliance: ComplianceInfo;
}
export interface ComplianceInfo {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    regulatoryRequirements: string[];
    retentionPolicy: string;
}
export interface EnvironmentPromotion {
    sourceEnvironmentId: string;
    targetEnvironmentId: string;
    promotionType: PromotionType;
    approvals: PromotionApproval[];
    rollbackPlan: RollbackPlan;
    validationChecks: ValidationCheck[];
}
export declare enum PromotionType {
    BLUE_GREEN = "blue_green",
    CANARY = "canary",
    ROLLING = "rolling"
}
export interface PromotionApproval {
    approver: string;
    approved: boolean;
    approvedAt?: Date;
    comments?: string;
}
export interface RollbackPlan {
    enabled: boolean;
    automaticTriggers: RollbackTrigger[];
    manualSteps: string[];
}
export interface RollbackTrigger {
    metric: string;
    threshold: number;
    duration: number;
}
export interface ValidationCheck {
    name: string;
    type: 'health_check' | 'performance_test' | 'security_scan' | 'compliance_check';
    configuration: Record<string, any>;
    required: boolean;
}
export declare class EnvironmentManager {
    private infrastructureManager;
    private environments;
    constructor(infrastructureManager: InfrastructureManager);
    createEnvironment(name: string, type: EnvironmentType, projectId: string, configuration?: Partial<EnvironmentConfiguration>): Promise<Environment>;
}
//# sourceMappingURL=EnvironmentManager.d.ts.map