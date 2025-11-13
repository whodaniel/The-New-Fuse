/**
 * Alert Management System
 */
import { EventEmitter } from 'events';
import { IAlertManager, AlertRule } from '../interfaces/IMonitoring';
import { Alert, AlertSeverity } from '../types/monitoring';
import { Logger } from '../utils/Logger';
export interface AlertManagerConfig {
    /** Alert check interval (ms) */
    checkInterval: number;
    /** Alert retention period (ms) */
    retentionPeriod: number;
}
/**
 * Alert manager implementation
 */
export declare class AlertManager extends EventEmitter implements IAlertManager {
    private readonly config;
    private readonly logger;
    private readonly alertRules;
    private readonly alerts;
    private readonly alertHistory;
    private checkTimer?;
    private running;
    constructor(config: AlertManagerConfig, logger?: Logger);
    /**
     * Start alert checking
     */
    start(): void;
    /**
     * Stop alert checking
     */
    stop(): void;
    /**
     * Register an alert rule
     */
    registerAlertRule(rule: AlertRule): void;
    /**
     * Remove an alert rule
     */
    removeAlertRule(name: string): boolean;
    /**
     * Get all alert rules
     */
    getAlertRules(): AlertRule[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get alert history
     */
    getAlertHistory(hours: number): Alert[];
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string, user: string): Promise<void>;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): Promise<void>;
    /**
     * Suppress an alert
     */
    suppressAlert(alertId: string, duration: number): Promise<void>;
    /**
     * Trigger an alert
     */
    triggerAlert(ruleName: string, description: string, severity: AlertSeverity, data?: Record<string, any>): Alert;
    /**
     * Check all alert rules
     */
    private checkAlerts;
    /**
     * Clean up old alerts
     */
    private cleanupAlerts;
    /**
     * Initialize default alert rules
     */
    private initializeDefaultRules;
    /**
     * Get current metrics (placeholder - would be injected from metrics collector)
     */
    private getCurrentMetrics;
    /**
     * Get error statistics (placeholder - would be injected from error monitor)
     */
    private getErrorStatistics;
}
//# sourceMappingURL=AlertManager.d.ts.map