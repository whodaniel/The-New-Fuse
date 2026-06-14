/**
 * Infrastructure Automation
 * Handles automated infrastructure operations, compliance, and disaster recovery
 */
import { InfrastructureManager } from './InfrastructureManager.js';
import { EnvironmentManager } from './EnvironmentManager.js';
export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    trigger: AutomationTrigger;
    actions: AutomationAction[];
    conditions: AutomationCondition[];
    enabled: boolean;
    schedule?: CronSchedule;
    createdAt: Date;
    updatedAt: Date;
}
export interface AutomationTrigger {
    type: TriggerType;
    configuration: Record<string, any>;
}
export declare enum TriggerType {
    SCHEDULE = "schedule",
    METRIC_THRESHOLD = "metric_threshold",
    INFRASTRUCTURE_CHANGE = "infrastructure_change",
    COMPLIANCE_VIOLATION = "compliance_violation",
    COST_THRESHOLD = "cost_threshold",
    SECURITY_ALERT = "security_alert"
}
export interface AutomationAction {
    type: ActionType;
    configuration: Record<string, any>;
    retryPolicy: RetryPolicy;
}
export declare enum ActionType {
    SCALE_INFRASTRUCTURE = "scale_infrastructure",
    UPDATE_CONFIGURATION = "update_configuration",
    CREATE_BACKUP = "create_backup",
    SEND_NOTIFICATION = "send_notification",
    RUN_COMPLIANCE_SCAN = "run_compliance_scan",
    APPLY_SECURITY_PATCH = "apply_security_patch",
    OPTIMIZE_COSTS = "optimize_costs"
}
export interface AutomationCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    REGEX_MATCH = "regex_match"
}
export interface RetryPolicy {
    enabled: boolean;
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    initialDelay: number;
    maxDelay: number;
}
export interface CronSchedule {
    expression: string;
    timezone: string;
}
export interface CompliancePolicy {
    id: string;
    name: string;
    framework: ComplianceFramework;
    controls: ComplianceControl[];
    severity: ComplianceSeverity;
    enabled: boolean;
}
export declare enum ComplianceFramework {
    SOC2 = "soc2",
    GDPR = "gdpr",
    HIPAA = "hipaa",
    PCI_DSS = "pci_dss",
    ISO_27001 = "iso_27001",
    CUSTOM = "custom"
}
export interface ComplianceControl {
    id: string;
    name: string;
    description: string;
    requirements: string[];
    automatedCheck: boolean;
    checkScript?: string;
}
export declare enum ComplianceSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface DisasterRecoveryPlan {
    id: string;
    name: string;
    environments: string[];
    rto: number;
    rpo: number;
    backupStrategy: BackupStrategy;
    recoverySteps: RecoveryStep[];
    testSchedule: CronSchedule;
    lastTested?: Date;
}
export interface BackupStrategy {
    type: BackupType;
    frequency: BackupFrequency;
    retention: RetentionPolicy;
    crossRegion: boolean;
    encryption: boolean;
}
export declare enum BackupType {
    FULL = "full",
    INCREMENTAL = "incremental",
    DIFFERENTIAL = "differential",
    SNAPSHOT = "snapshot"
}
export declare enum BackupFrequency {
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export interface RetentionPolicy {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
}
export interface RecoveryStep {
    id: string;
    name: string;
    description: string;
    order: number;
    automated: boolean;
    script?: string;
    estimatedDuration: number;
    dependencies: string[];
}
export declare class InfrastructureAutomation {
    private infrastructureManager;
    private environmentManager;
    private automationRules;
    private compliancePolicies;
    private disasterRecoveryPlans;
    private isRunning;
    constructor(infrastructureManager: InfrastructureManager, environmentManager: EnvironmentManager);
    start(): Promise<void>;
    stop(): Promise<void>;
    addAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule>;
    executeAutomationRule(ruleId: string, context?: Record<string, any>): Promise<AutomationExecutionResult>;
    addCompliancePolicy(policy: Omit<CompliancePolicy, 'id'>): Promise<CompliancePolicy>;
    runComplianceScan(policyId?: string): Promise<ComplianceScanResult>;
    addDisasterRecoveryPlan(plan: Omit<DisasterRecoveryPlan, 'id'>): Promise<DisasterRecoveryPlan>;
    executeDisasterRecovery(planId: string, targetEnvironment: string): Promise<DisasterRecoveryResult>;
    private startScheduledAutomation;
    private startComplianceMonitoring;
    private startDisasterRecoveryTesting;
    private evaluateConditions;
    private evaluateCondition;
    private executeAction;
    private scanPolicy;
    private executeRecoveryStep;
    private shouldRunScheduledRule;
    private shouldRunDRTest;
    private scaleInfrastructure;
    private updateConfiguration;
    private createBackup;
    private sendNotification;
    private applySecurityPatch;
    private optimizeCosts;
    private generateId;
}
export interface AutomationExecutionResult {
    ruleId: string;
    success: boolean;
    message: string;
    executedActions: ActionExecutionResult[];
    duration: number;
}
export interface ActionExecutionResult {
    actionType: ActionType;
    success: boolean;
    duration: number;
    error?: string;
}
export interface ComplianceScanResult {
    scanId: string;
    timestamp: Date;
    overallCompliant: boolean;
    totalViolations: number;
    policyResults: PolicyScanResult[];
}
export interface PolicyScanResult {
    policyId: string;
    policyName: string;
    framework: ComplianceFramework;
    compliant: boolean;
    violations: ComplianceViolation[];
    scanTimestamp: Date;
}
export interface ComplianceViolation {
    controlId: string;
    controlName: string;
    description: string;
    severity: ComplianceSeverity;
    remediation: string;
}
export interface DisasterRecoveryResult {
    planId: string;
    success: boolean;
    targetEnvironment: string;
    executedSteps: StepExecutionResult[];
    totalDuration: number;
    recoveredAt?: Date;
    error?: string;
}
export interface StepExecutionResult {
    stepId: string;
    stepName: string;
    success: boolean;
    duration: number;
    error?: string;
}
//# sourceMappingURL=InfrastructureAutomation.d.ts.map