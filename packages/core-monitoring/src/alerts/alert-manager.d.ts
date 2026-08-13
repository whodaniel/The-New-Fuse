/**
 * Alert Manager
 * Manages alert rules and notifications
 */
import { EventEmitter } from 'events';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'pending' | 'firing' | 'resolved';
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    operator: ComparisonOperator;
    threshold: number;
    duration: number;
    severity: AlertSeverity;
    enabled: boolean;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    actions?: AlertAction[];
}
export interface AlertAction {
    type: 'email' | 'slack' | 'webhook' | 'pagerduty';
    config: Record<string, any>;
    enabled: boolean;
}
export interface Alert {
    id: string;
    rule: AlertRule;
    status: AlertStatus;
    value: number;
    threshold: number;
    firedAt?: Date;
    resolvedAt?: Date;
    lastEvaluatedAt: Date;
    notificationsSent: number;
    metadata?: Record<string, any>;
}
export interface AlertManagerConfig {
    evaluationInterval: number;
    notificationCooldown: number;
    autoResolveAfter?: number;
    enabled: boolean;
}
/**
 * Alert Manager Service
 */
export declare class AlertManager extends EventEmitter {
    private rules;
    private activeAlerts;
    private alertHistory;
    private intervalId?;
    private config;
    private metricsProvider?;
    constructor(config: AlertManagerConfig);
    /**
     * Set metrics provider function
     */
    setMetricsProvider(provider: () => Promise<Record<string, number>>): void;
    /**
     * Add an alert rule
     */
    addRule(rule: AlertRule): void;
    /**
     * Remove an alert rule
     */
    removeRule(ruleId: string): void;
    /**
     * Update an alert rule
     */
    updateRule(ruleId: string, updates: Partial<AlertRule>): void;
    /**
     * Get all rules
     */
    getRules(): AlertRule[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get alert history
     */
    getAlertHistory(limit?: number): Alert[];
    /**
     * Start alert evaluation
     */
    start(): void;
    /**
     * Stop alert evaluation
     */
    stop(): void;
    /**
     * Evaluate all alert rules
     */
    private evaluateRules;
    /**
     * Evaluate a single alert rule
     */
    private evaluateRule;
    /**
     * Evaluate a condition
     */
    private evaluateCondition;
    /**
     * Fire an alert
     */
    private fireAlert;
    /**
     * Resolve an alert
     */
    private resolveAlert;
    /**
     * Auto-resolve old alerts
     */
    private autoResolveAlerts;
    /**
     * Execute an alert action
     */
    private executeAlertAction;
    /**
     * Manually trigger an alert
     */
    triggerAlert(ruleId: string, value: number, metadata?: Record<string, any>): void;
    /**
     * Manually resolve an alert
     */
    manualResolveAlert(alertId: string): void;
}
/**
 * Default alert rules for common scenarios
 */
export declare const defaultAlertRules: AlertRule[];
//# sourceMappingURL=alert-manager.d.ts.map