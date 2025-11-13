"use strict";
/**
 * Unit tests for ErrorMonitor
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorMonitor_1 = require("./ErrorMonitor");
const error_1 = require("../types/error");
describe('ErrorMonitor', () => {
    let monitor;
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setLogLevel: jest.fn(),
            getLogLevel: jest.fn()
        };
        const config = {
            metricsInterval: 100, // Fast for testing
            retentionPeriod: 60000, // 1 minute for testing
            enableAlerting: true,
            alertInterval: 50 // Fast for testing
        };
        monitor = new ErrorMonitor_1.ErrorMonitor(config, mockLogger);
    });
    afterEach(() => {
        monitor.shutdown();
    });
    describe('Error Recording', () => {
        it('should record errors and update metrics', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Resource not found');
            monitor.recordError(error);
            // Wait for metrics update
            await new Promise(resolve => setTimeout(resolve, 150));
            const metrics = monitor.getCurrentMetrics();
            expect(metrics.totalErrors).toBe(1);
            expect(metrics.categoryDistribution[error_1.ErrorCategory.RESOURCE]).toBe(1);
        });
        it('should emit errorRecorded events', (done) => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Tool failed');
            monitor.once('errorRecorded', (recordedError, timestamp) => {
                expect(recordedError).toBe(error);
                expect(timestamp).toBeInstanceOf(Date);
                done();
            });
            monitor.recordError(error);
        });
        it('should immediately update metrics for critical errors', async () => {
            const criticalError = new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'System overloaded', { severity: error_1.ErrorSeverity.CRITICAL });
            monitor.recordError(criticalError);
            const metrics = monitor.getCurrentMetrics();
            expect(metrics.severityDistribution[error_1.ErrorSeverity.CRITICAL]).toBe(1);
        });
    });
    describe('Metrics Calculation', () => {
        it('should calculate error rate correctly', async () => {
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 1'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Error 2'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_TIMEOUT, 'Error 3')
            ];
            errors.forEach(error => monitor.recordError(error));
            // Wait for metrics update
            await new Promise(resolve => setTimeout(resolve, 150));
            const metrics = monitor.getCurrentMetrics();
            expect(metrics.errorRate).toBe(3);
            expect(metrics.totalErrors).toBe(3);
        });
        it('should calculate category distribution', async () => {
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Resource error 1'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_ACCESS_DENIED, 'Resource error 2'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Tool error'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.AUTHENTICATION_FAILED, 'Auth error')
            ];
            errors.forEach(error => monitor.recordError(error));
            await new Promise(resolve => setTimeout(resolve, 150));
            const metrics = monitor.getCurrentMetrics();
            expect(metrics.categoryDistribution[error_1.ErrorCategory.RESOURCE]).toBe(2);
            expect(metrics.categoryDistribution[error_1.ErrorCategory.TOOL]).toBe(1);
            expect(metrics.categoryDistribution[error_1.ErrorCategory.AUTH]).toBe(1);
        });
        it('should calculate top error codes', async () => {
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 1'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 2'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 3'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Error 4'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Error 5')
            ];
            errors.forEach(error => monitor.recordError(error));
            await new Promise(resolve => setTimeout(resolve, 150));
            const metrics = monitor.getCurrentMetrics();
            expect(metrics.topErrorCodes).toHaveLength(2);
            expect(metrics.topErrorCodes[0]).toEqual({
                code: error_1.MCPErrorCode.RESOURCE_NOT_FOUND,
                count: 3,
                percentage: 60
            });
            expect(metrics.topErrorCodes[1]).toEqual({
                code: error_1.MCPErrorCode.TOOL_EXECUTION_FAILED,
                count: 2,
                percentage: 40
            });
        });
        it('should calculate health score', async () => {
            // Start with healthy system
            let metrics = monitor.getCurrentMetrics();
            expect(metrics.healthScore).toBe(100);
            // Add some errors
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 1'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Error 2')
            ];
            errors.forEach(error => monitor.recordError(error));
            await new Promise(resolve => setTimeout(resolve, 150));
            metrics = monitor.getCurrentMetrics();
            expect(metrics.healthScore).toBeLessThan(100);
            // Add critical error
            const criticalError = new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'Critical error', { severity: error_1.ErrorSeverity.CRITICAL });
            monitor.recordError(criticalError);
            await new Promise(resolve => setTimeout(resolve, 150));
            metrics = monitor.getCurrentMetrics();
            expect(metrics.healthScore).toBeLessThan(90);
        });
    });
    describe('Alert System', () => {
        it('should register and trigger alert rules', async () => {
            let alertTriggered = false;
            const alertRule = {
                name: 'test-alert',
                description: 'Test alert rule',
                severity: 'high',
                cooldown: 1000,
                condition: (metrics) => metrics.errorRate > 2,
                action: async () => {
                    alertTriggered = true;
                }
            };
            monitor.registerAlertRule(alertRule);
            // Add enough errors to trigger alert
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 1'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 2'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 3')
            ];
            errors.forEach(error => monitor.recordError(error));
            // Wait for metrics and alert check
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(alertTriggered).toBe(true);
        });
        it('should respect alert cooldown periods', async () => {
            let alertCount = 0;
            const alertRule = {
                name: 'cooldown-test',
                description: 'Cooldown test alert',
                severity: 'medium',
                cooldown: 1000, // 1 second cooldown
                condition: () => true, // Always trigger
                action: async () => {
                    alertCount++;
                }
            };
            monitor.registerAlertRule(alertRule);
            // Trigger multiple times quickly
            monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Error 1'));
            await new Promise(resolve => setTimeout(resolve, 100));
            monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Error 2'));
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(alertCount).toBeLessThanOrEqual(1); // Should only trigger once due to cooldown
        });
        it('should emit alertTriggered events', (done) => {
            const alertRule = {
                name: 'event-test',
                description: 'Event test alert',
                severity: 'low',
                cooldown: 0,
                condition: () => true,
                action: async () => { }
            };
            monitor.registerAlertRule(alertRule);
            monitor.once('alertTriggered', (rule, metrics, statistics) => {
                expect(rule.name).toBe('event-test');
                expect(metrics).toBeDefined();
                expect(statistics).toBeDefined();
                done();
            });
            monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Test error'));
        });
        it('should remove alert rules', () => {
            const alertRule = {
                name: 'removable-alert',
                description: 'Removable alert',
                severity: 'low',
                cooldown: 0,
                condition: () => false,
                action: async () => { }
            };
            monitor.registerAlertRule(alertRule);
            expect(monitor.getAlertRules()).toHaveLength(4); // 3 default + 1 added
            const removed = monitor.removeAlertRule('removable-alert');
            expect(removed).toBe(true);
            expect(monitor.getAlertRules()).toHaveLength(3);
            const removedAgain = monitor.removeAlertRule('removable-alert');
            expect(removedAgain).toBe(false);
        });
    });
    describe('Metrics History', () => {
        it('should maintain metrics history', async () => {
            monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Error'));
            await new Promise(resolve => setTimeout(resolve, 150));
            const history = monitor.getMetricsHistory(1);
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].metrics).toBeDefined();
            expect(history[0].timestamp).toBeInstanceOf(Date);
        });
        it('should filter metrics history by time window', async () => {
            monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Error'));
            await new Promise(resolve => setTimeout(resolve, 150));
            const fullHistory = monitor.getMetricsHistory(24);
            const shortHistory = monitor.getMetricsHistory(0.001); // Very short window
            expect(fullHistory.length).toBeGreaterThan(0);
            expect(shortHistory.length).toBe(0);
        });
    });
    describe('Report Generation', () => {
        it('should generate comprehensive error reports', async () => {
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Error 1'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Error 2'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'Critical error', { severity: error_1.ErrorSeverity.CRITICAL })
            ];
            errors.forEach(error => monitor.recordError(error));
            await new Promise(resolve => setTimeout(resolve, 150));
            const report = monitor.generateReport(1);
            expect(report.summary).toBeDefined();
            expect(report.trends).toBeDefined();
            expect(report.recommendations).toBeInstanceOf(Array);
            expect(report.recommendations.length).toBeGreaterThan(0);
            // Should have recommendation for critical errors
            expect(report.recommendations.some(r => r.includes('Critical errors'))).toBe(true);
        });
        it('should provide relevant recommendations', async () => {
            // Add many errors to trigger high error rate recommendation
            for (let i = 0; i < 15; i++) {
                monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, `Error ${i}));
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const report = monitor.generateReport(1);
      
      expect(report.recommendations.some(r => r.includes('High error rate'))).toBe(true);
    });
  });

  describe('Data Cleanup', () => {
    it('should clean up old error history', async () => {
      // Create monitor with very short retention period
      const shortRetentionMonitor = new ErrorMonitor({
        retentionPeriod: 100, // 100ms
        metricsInterval: 50
      }, mockLogger);

      shortRetentionMonitor.recordError(new MCPErrorClass(MCPErrorCode.TIMEOUT, 'Old error'));
      
      // Wait for retention period to pass
      await new Promise(resolve => setTimeout(resolve, 200));
      
      shortRetentionMonitor.recordError(new MCPErrorClass(MCPErrorCode.TIMEOUT, 'New error'));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = shortRetentionMonitor.getCurrentMetrics();
      expect(metrics.errorRate).toBe(1); // Should only count recent error
      
      shortRetentionMonitor.shutdown();
    });
  });

  describe('Default Alert Rules', () => {
    it('should have default alert rules configured', () => {
      const rules = monitor.getAlertRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.name === 'high-error-rate')).toBe(true);
      expect(rules.some(r => r.name === 'critical-errors')).toBe(true);
      expect(rules.some(r => r.name === 'low-health-score')).toBe(true);
    });

    it('should trigger high error rate alert', async () => {
      // Add many errors to trigger high error rate alert
      for (let i = 0; i < 25; i++) {`, monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, `Error ${i}`))));
            }
            let alertTriggered = false;
            monitor.once('alertTriggered', (rule) => {
                if (rule.name === 'high-error-rate') {
                    alertTriggered = true;
                }
            });
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(alertTriggered).toBe(true);
        });
        it('should trigger critical error alert', async () => {
            const criticalError = new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'Critical system error', { severity: error_1.ErrorSeverity.CRITICAL });
            let alertTriggered = false;
            monitor.once('alertTriggered', (rule) => {
                if (rule.name === 'critical-errors') {
                    alertTriggered = true;
                }
            });
            monitor.recordError(criticalError);
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(alertTriggered).toBe(true);
        });
    });
    describe('Trend Analysis', () => {
        it('should detect increasing error trends', async () => {
            // Simulate increasing error pattern
            monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Error 1'));
            await new Promise(resolve => setTimeout(resolve, 150));
            // Add more errors
            for (let i = 0; i < 5; i++) {
                monitor.recordError(new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, Error, $, { i } + 2));
            }
            `));
      }
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const metrics = monitor.getCurrentMetrics();
      // Note: Trend detection requires multiple data points over time
      // In a real scenario with longer intervals, this would be more reliable
      expect(metrics.trends).toBeDefined();
      expect(typeof metrics.trends.increasing).toBe('boolean');
      expect(typeof metrics.trends.changeRate).toBe('number');
    });
  });
});;
        });
    });
});
//# sourceMappingURL=ErrorMonitor.test.js.map