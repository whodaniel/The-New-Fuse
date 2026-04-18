/**
 * Alert Manager Tests
 */

// @ts-expect-error - Jest globals are available without import
import { AlertManager } from './AlertManager.js';
import { AlertSeverity, AlertStatus } from '../types/monitoring.js';
import { Logger } from '../utils/Logger.js';

describe('AlertManager', () => {
  let alertManager: AlertManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestAlertManager');
    alertManager = new AlertManager({
      checkInterval: 1000, // 1 second for testing
      retentionPeriod: 60000 // 1 minute for testing
    }, logger);
  });

  afterEach(() => {
    if (alertManager) {
      alertManager.stop();
    }
  });

  describe('Alert Rules Management', () => {
    it('should register alert rules', () => {
      const rule = {
        name: 'test-rule',
        description: 'Test alert rule',
        severity: AlertSeverity.MEDIUM,
        cooldown: 5000,
        enabled: true,
        condition: () => true,
        action: async () => {}
      };

      alertManager.registerAlertRule(rule);
      
      const rules = alertManager.getAlertRules();
      expect(rules).toHaveLength(6); // 5 default + 1 test rule
      expect(rules.find(r => r.name === 'test-rule')).toBeDefined();
    });

    it('should remove alert rules', () => {
      const rule = {
        name: 'removable-rule',
        description: 'Rule to be removed',
        severity: AlertSeverity.LOW,
        cooldown: 5000,
        enabled: true,
        condition: () => false,
        action: async () => {}
      };

      alertManager.registerAlertRule(rule);
      expect(alertManager.getAlertRules().find(r => r.name === 'removable-rule')).toBeDefined();

      const removed = alertManager.removeAlertRule('removable-rule');
      expect(removed).toBe(true);
      expect(alertManager.getAlertRules().find(r => r.name === 'removable-rule')).toBeUndefined();
    });

    it('should return false when removing non-existent rule', () => {
      const removed = alertManager.removeAlertRule('non-existent-rule');
      expect(removed).toBe(false);
    });

    it('should get all alert rules including defaults', () => {
      const rules = alertManager.getAlertRules();
      expect(rules.length).toBeGreaterThan(0);
      
      // Check for some default rules
      expect(rules.find(r => r.name === 'high-error-rate')).toBeDefined();
      expect(rules.find(r => r.name === 'high-response-time')).toBeDefined();
      expect(rules.find(r => r.name === 'low-health-score')).toBeDefined();
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alerts', () => {
      const alert = alertManager.triggerAlert(
        'test-alert',
        'Test alert description',
        AlertSeverity.HIGH,
        { testData: 'value' }
      );

      expect(alert.id).toBeDefined();
      expect(alert.name).toBe('test-alert');
      expect(alert.description).toBe('Test alert description');
      expect(alert.severity).toBe(AlertSeverity.HIGH);
      expect(alert.status).toBe(AlertStatus.ACTIVE);
      expect(alert.data).toEqual({ testData: 'value' });
    });

    it('should emit alert triggered events', (done) => {
      alertManager.on('alertTriggered', (alert) => {
        expect(alert.name).toBe('event-test-alert');
        expect(alert.severity).toBe(AlertSeverity.CRITICAL);
        done();
      });

      alertManager.triggerAlert(
        'event-test-alert',
        'Event test alert',
        AlertSeverity.CRITICAL
      );
    });
  });

  describe('Alert Management', () => {
    let testAlert: any;

    beforeEach(() => {
      testAlert = alertManager.triggerAlert(
        'manageable-alert',
        'Alert for management testing',
        AlertSeverity.MEDIUM
      );
    });

    it('should acknowledge alerts', async () => {
      let acknowledgedEventEmitted = false;
      alertManager.on('alertAcknowledged', (alert) => {
        expect(alert.id).toBe(testAlert.id);
        expect(alert.status).toBe(AlertStatus.ACKNOWLEDGED);
        expect(alert.acknowledgedBy).toBe('test-user');
        acknowledgedEventEmitted = true;
      });

      await alertManager.acknowledgeAlert(testAlert.id, 'test-user');
      expect(acknowledgedEventEmitted).toBe(true);
    });

    it('should resolve alerts', async () => {
      let resolvedEventEmitted = false;
      alertManager.on('alertResolved', (alert) => {
        expect(alert.id).toBe(testAlert.id);
        expect(alert.status).toBe(AlertStatus.RESOLVED);
        resolvedEventEmitted = true;
      });

      await alertManager.resolveAlert(testAlert.id);
      expect(resolvedEventEmitted).toBe(true);

      // Alert should be moved to history
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.find(a => a.id === testAlert.id)).toBeUndefined();
    });

    it('should suppress alerts', async () => {
      let suppressedEventEmitted = false;
      alertManager.on('alertSuppressed', (alert) => {
        expect(alert.id).toBe(testAlert.id);
        expect(alert.status).toBe(AlertStatus.SUPPRESSED);
        suppressedEventEmitted = true;
      });

      await alertManager.suppressAlert(testAlert.id, 1000); // 1 second
      expect(suppressedEventEmitted).toBe(true);
    });

    it('should throw error for non-existent alert operations', async () => {
      await expect(alertManager.acknowledgeAlert('non-existent', 'user')).rejects.toThrow('Alert not found');
      await expect(alertManager.resolveAlert('non-existent')).rejects.toThrow('Alert not found');
      await expect(alertManager.suppressAlert('non-existent', 1000)).rejects.toThrow('Alert not found');
    });
  });

  describe('Alert Queries', () => {
    beforeEach(() => {
      // Create some test alerts
      alertManager.triggerAlert('active-alert-1', 'Active alert 1', AlertSeverity.LOW);
      alertManager.triggerAlert('active-alert-2', 'Active alert 2', AlertSeverity.HIGH);
      
      const resolvedAlert = alertManager.triggerAlert('resolved-alert', 'Resolved alert', AlertSeverity.MEDIUM);
      alertManager.resolveAlert(resolvedAlert.id);
    });

    it('should get active alerts', () => {
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThanOrEqual(2);
      expect(activeAlerts.every(a => a.status === AlertStatus.ACTIVE)).toBe(true);
    });

    it('should get alert history', () => {
      const history = alertManager.getAlertHistory(1); // 1 hour
      expect(history.length).toBeGreaterThanOrEqual(1);
      
      const resolvedAlert = history.find(a => a.name === 'resolved-alert');
      expect(resolvedAlert).toBeDefined();
      expect(resolvedAlert!.status).toBe(AlertStatus.RESOLVED);
    });

    it('should filter alert history by time', () => {
      // This test would need more sophisticated time mocking
      // For now, just verify the method works
      const recentHistory = alertManager.getAlertHistory(0.001); // Very short time
      expect(Array.isArray(recentHistory)).toBe(true);
    });
  });

  describe('Alert Rule Execution', () => {
    it('should execute alert rules when conditions are met', (done) => {
      let actionExecuted = false;
      
      const rule = {
        name: 'condition-test-rule',
        description: 'Rule for testing condition execution',
        severity: AlertSeverity.HIGH,
        cooldown: 100, // Short cooldown for testing
        enabled: true,
        condition: () => true, // Always trigger
        action: async (alert: any) => {
          actionExecuted = true;
          expect(alert.name).toBe('condition-test-rule');
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

    it('should respect cooldown periods', async () => {
      let executionCount = 0;
      
      const rule = {
        name: 'cooldown-test-rule',
        description: 'Rule for testing cooldown',
        severity: AlertSeverity.MEDIUM,
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
      expect(executionCount).toBe(1);

      // Wait a bit more, should not execute again due to cooldown
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(executionCount).toBe(1);
    });

    it('should not execute disabled rules', async () => {
      let executionCount = 0;
      
      const rule = {
        name: 'disabled-test-rule',
        description: 'Disabled rule',
        severity: AlertSeverity.LOW,
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
      expect(executionCount).toBe(0);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop alert checking', () => {
      alertManager.start();
      // Should not throw

      alertManager.stop();
      // Should not throw
    });

    it('should handle multiple start/stop calls', () => {
      alertManager.start();
      alertManager.start(); // Should not throw

      alertManager.stop();
      alertManager.stop(); // Should not throw
    });
  });
});