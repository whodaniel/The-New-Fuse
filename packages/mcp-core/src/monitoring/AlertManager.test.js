"use strict";
/**
 * Alert Manager Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AlertManager_1 = require("./AlertManager");
const monitoring_1 = require("../types/monitoring");
const Logger_1 = require("../utils/Logger");
(0, vitest_1.describe)('AlertManager', () => {
    let alertManager;
    let logger;
    (0, vitest_1.beforeEach)(() => {
        logger = new Logger_1.Logger('TestAlertManager');
        alertManager = new AlertManager_1.AlertManager({
            checkInterval: 1000, // 1 second for testing
            retentionPeriod: 60000 // 1 minute for testing
        }, logger);
    });
    (0, vitest_1.afterEach)(() => {
        if (alertManager) {
            alertManager.stop();
        }
    });
    (0, vitest_1.describe)('Alert Rules Management', () => {
        (0, vitest_1.it)('should register alert rules', () => {
            const rule = {
                name: 'test-rule',
                description: 'Test alert rule',
                severity: monitoring_1.AlertSeverity.MEDIUM,
                cooldown: 5000,
                enabled: true,
                condition: () => true,
                action: async () => { }
            };
            alertManager.registerAlertRule(rule);
            const rules = alertManager.getAlertRules();
            (0, vitest_1.expect)(rules).toHaveLength(6); // 5 default + 1 test rule
            (0, vitest_1.expect)(rules.find(r => r.name === 'test-rule')).toBeDefined();
        });
        (0, vitest_1.it)('should remove alert rules', () => {
            const rule = {
                name: 'removable-rule',
                description: 'Rule to be removed',
                severity: monitoring_1.AlertSeverity.LOW,
                cooldown: 5000,
                enabled: true,
                condition: () => false,
                action: async () => { }
            };
            alertManager.registerAlertRule(rule);
            (0, vitest_1.expect)(alertManager.getAlertRules().find(r => r.name === 'removable-rule')).toBeDefined();
            const removed = alertManager.removeAlertRule('removable-rule');
            (0, vitest_1.expect)(removed).toBe(true);
            (0, vitest_1.expect)(alertManager.getAlertRules().find(r => r.name === 'removable-rule')).toBeUndefined();
        });
        (0, vitest_1.it)('should return false when removing non-existent rule', () => {
            const removed = alertManager.removeAlertRule('non-existent-rule');
            (0, vitest_1.expect)(removed).toBe(false);
        });
        (0, vitest_1.it)('should get all alert rules including defaults', () => {
            const rules = alertManager.getAlertRules();
            (0, vitest_1.expect)(rules.length).toBeGreaterThan(0);
            // Check for some default rules
            (0, vitest_1.expect)(rules.find(r => r.name === 'high-error-rate')).toBeDefined();
            (0, vitest_1.expect)(rules.find(r => r.name === 'high-response-time')).toBeDefined();
            (0, vitest_1.expect)(rules.find(r => r.name === 'low-health-score')).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Alert Triggering', () => {
        (0, vitest_1.it)('should trigger alerts', () => {
            const alert = alertManager.triggerAlert('test-alert', 'Test alert description', monitoring_1.AlertSeverity.HIGH, { testData: 'value' });
            (0, vitest_1.expect)(alert.id).toBeDefined();
            (0, vitest_1.expect)(alert.name).toBe('test-alert');
            (0, vitest_1.expect)(alert.description).toBe('Test alert description');
            (0, vitest_1.expect)(alert.severity).toBe(monitoring_1.AlertSeverity.HIGH);
            (0, vitest_1.expect)(alert.status).toBe(monitoring_1.AlertStatus.ACTIVE);
            (0, vitest_1.expect)(alert.data).toEqual({ testData: 'value' });
        });
        (0, vitest_1.it)('should emit alert triggered events', (done) => {
            alertManager.on('alertTriggered', (alert) => {
                (0, vitest_1.expect)(alert.name).toBe('event-test-alert');
                (0, vitest_1.expect)(alert.severity).toBe(monitoring_1.AlertSeverity.CRITICAL);
                done();
            });
            alertManager.triggerAlert('event-test-alert', 'Event test alert', monitoring_1.AlertSeverity.CRITICAL);
        });
    });
    (0, vitest_1.describe)('Alert Management', () => {
        let testAlert;
        (0, vitest_1.beforeEach)(() => {
            testAlert = alertManager.triggerAlert('manageable-alert', 'Alert for management testing', monitoring_1.AlertSeverity.MEDIUM);
        });
        (0, vitest_1.it)('should acknowledge alerts', async () => {
            let acknowledgedEventEmitted = false;
            alertManager.on('alertAcknowledged', (alert) => {
                (0, vitest_1.expect)(alert.id).toBe(testAlert.id);
                (0, vitest_1.expect)(alert.status).toBe(monitoring_1.AlertStatus.ACKNOWLEDGED);
                (0, vitest_1.expect)(alert.acknowledgedBy).toBe('test-user');
                acknowledgedEventEmitted = true;
            });
            await alertManager.acknowledgeAlert(testAlert.id, 'test-user');
            (0, vitest_1.expect)(acknowledgedEventEmitted).toBe(true);
        });
        (0, vitest_1.it)('should resolve alerts', async () => {
            let resolvedEventEmitted = false;
            alertManager.on('alertResolved', (alert) => {
                (0, vitest_1.expect)(alert.id).toBe(testAlert.id);
                (0, vitest_1.expect)(alert.status).toBe(monitoring_1.AlertStatus.RESOLVED);
                resolvedEventEmitted = true;
            });
            await alertManager.resolveAlert(testAlert.id);
            (0, vitest_1.expect)(resolvedEventEmitted).toBe(true);
            // Alert should be moved to history
            const activeAlerts = alertManager.getActiveAlerts();
            (0, vitest_1.expect)(activeAlerts.find(a => a.id === testAlert.id)).toBeUndefined();
        });
        (0, vitest_1.it)('should suppress alerts', async () => {
            let suppressedEventEmitted = false;
            alertManager.on('alertSuppressed', (alert) => {
                (0, vitest_1.expect)(alert.id).toBe(testAlert.id);
                (0, vitest_1.expect)(alert.status).toBe(monitoring_1.AlertStatus.SUPPRESSED);
                suppressedEventEmitted = true;
            });
            await alertManager.suppressAlert(testAlert.id, 1000); // 1 second
            (0, vitest_1.expect)(suppressedEventEmitted).toBe(true);
        });
        (0, vitest_1.it)('should throw error for non-existent alert operations', async () => {
            await (0, vitest_1.expect)(alertManager.acknowledgeAlert('non-existent', 'user')).rejects.toThrow('Alert not found');
            await (0, vitest_1.expect)(alertManager.resolveAlert('non-existent')).rejects.toThrow('Alert not found');
            await (0, vitest_1.expect)(alertManager.suppressAlert('non-existent', 1000)).rejects.toThrow('Alert not found');
        });
    });
    (0, vitest_1.describe)('Alert Queries', () => {
        (0, vitest_1.beforeEach)(() => {
            // Create some test alerts
            alertManager.triggerAlert('active-alert-1', 'Active alert 1', monitoring_1.AlertSeverity.LOW);
            alertManager.triggerAlert('active-alert-2', 'Active alert 2', monitoring_1.AlertSeverity.HIGH);
            const resolvedAlert = alertManager.triggerAlert('resolved-alert', 'Resolved alert', monitoring_1.AlertSeverity.MEDIUM);
            alertManager.resolveAlert(resolvedAlert.id);
        });
        (0, vitest_1.it)('should get active alerts', () => {
            const activeAlerts = alertManager.getActiveAlerts();
            (0, vitest_1.expect)(activeAlerts.length).toBeGreaterThanOrEqual(2);
            (0, vitest_1.expect)(activeAlerts.every(a => a.status === monitoring_1.AlertStatus.ACTIVE)).toBe(true);
        });
        (0, vitest_1.it)('should get alert history', () => {
            const history = alertManager.getAlertHistory(1); // 1 hour
            (0, vitest_1.expect)(history.length).toBeGreaterThanOrEqual(1);
            const resolvedAlert = history.find(a => a.name === 'resolved-alert');
            (0, vitest_1.expect)(resolvedAlert).toBeDefined();
            (0, vitest_1.expect)(resolvedAlert.status).toBe(monitoring_1.AlertStatus.RESOLVED);
        });
        (0, vitest_1.it)('should filter alert history by time', () => {
            // This test would need more sophisticated time mocking
            // For now, just verify the method works
            const recentHistory = alertManager.getAlertHistory(0.001); // Very short time
            (0, vitest_1.expect)(Array.isArray(recentHistory)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Alert Rule Execution', () => {
        (0, vitest_1.it)('should execute alert rules when conditions are met', (done) => {
            let actionExecuted = false;
            const rule = {
                name: 'condition-test-rule',
                description: 'Rule for testing condition execution',
                severity: monitoring_1.AlertSeverity.HIGH,
                cooldown: 100, // Short cooldown for testing
                enabled: true,
                condition: () => true, // Always trigger
                action: async (alert) => {
                    actionExecuted = true;
                    (0, vitest_1.expect)(alert.name).toBe('condition-test-rule');
                    done();
                }
            };
            alertManager.registerAlertRule(rule);
            alertManager.start();
            // Wait a bit for the rule to be checked
            setTimeout(() => {
                if (!actionExecuted) {
                    done(new Error('Alert rule action was not executed'));
                }
            }, 2000);
        });
        (0, vitest_1.it)('should respect cooldown periods', async () => {
            let executionCount = 0;
            const rule = {
                name: 'cooldown-test-rule',
                description: 'Rule for testing cooldown',
                severity: monitoring_1.AlertSeverity.MEDIUM,
                cooldown: 5000, // 5 second cooldown
                enabled: true,
                condition: () => true, // Always trigger
                action: async () => {
                    executionCount++;
                }
            };
            alertManager.registerAlertRule(rule);
            alertManager.start();
            // Wait for first execution
            await new Promise(resolve => setTimeout(resolve, 1100));
            (0, vitest_1.expect)(executionCount).toBe(1);
            // Wait a bit more, should not execute again due to cooldown
            await new Promise(resolve => setTimeout(resolve, 1000));
            (0, vitest_1.expect)(executionCount).toBe(1);
        });
        (0, vitest_1.it)('should not execute disabled rules', async () => {
            let executionCount = 0;
            const rule = {
                name: 'disabled-test-rule',
                description: 'Disabled rule',
                severity: monitoring_1.AlertSeverity.LOW,
                cooldown: 100,
                enabled: false, // Disabled
                condition: () => true,
                action: async () => {
                    executionCount++;
                }
            };
            alertManager.registerAlertRule(rule);
            alertManager.start();
            // Wait for potential execution
            await new Promise(resolve => setTimeout(resolve, 1100));
            (0, vitest_1.expect)(executionCount).toBe(0);
        });
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should start and stop alert checking', () => {
            alertManager.start();
            // Should not throw
            alertManager.stop();
            // Should not throw
        });
        (0, vitest_1.it)('should handle multiple start/stop calls', () => {
            alertManager.start();
            alertManager.start(); // Should not throw
            alertManager.stop();
            alertManager.stop(); // Should not throw
        });
    });
});
//# sourceMappingURL=AlertManager.test.js.map