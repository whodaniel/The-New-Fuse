"use strict";
/**
 * Error Monitoring and Metrics Collection System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMonitor = void 0;
const events_1 = require("events");
const error_1 = require("../types/error");
const Logger_1 = require("../utils/Logger");
/**
 * Error monitoring system
 */
class ErrorMonitor extends events_1.EventEmitter {
    config;
    logger;
    errorHistory = [];
    alertRules = new Map();
    metricsHistory = [];
    metricsTimer;
    alertTimer;
    currentMetrics;
    constructor(config = {}, logger) {
        super();
        this.config = {
            metricsInterval: 30000, // 30 seconds
            retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
            enableAlerting: true,
            alertInterval: 60000, // 1 minute
            healthWeights: {
                errorRate: 0.4,
                severity: 0.3,
                recovery: 0.2,
                trends: 0.1
            },
            ...config
        };
        this.logger = logger || new Logger_1.Logger('ErrorMonitor');
        this.currentMetrics = this.initializeMetrics();
        this.initializeDefaultAlertRules();
        this.startMonitoring();
    }
    /**
     * Record an error occurrence
     */
    recordError(error) {
        const timestamp = new Date();
        this.errorHistory.push({ error, timestamp });
        // Clean up old entries
        this.cleanupHistory();
        // Update metrics immediately for critical errors
        if (error.severity === error_1.ErrorSeverity.CRITICAL) {
            this.updateMetrics();
        }
        this.emit('errorRecorded', error, timestamp);
    }
    /**
     * Get current metrics
     */
    getCurrentMetrics() {
        return { ...this.currentMetrics };
    }
    /**
     * Get metrics history
     */
    getMetricsHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(entry => entry.timestamp >= cutoff);
    }
    /**
     * Register an alert rule
     */
    registerAlertRule(rule) {
        this.alertRules.set(rule.name, rule);
        this.logger.debug(`Registered alert rule: ${rule.name});
  }

  /**
   * Remove an alert rule
   */
  removeAlertRule(name: string): boolean {
    const removed = this.alertRules.delete(name);
    if (removed) {`, this.logger.debug(`Removed alert rule: ${name}`));
    }
}
exports.ErrorMonitor = ErrorMonitor;
return removed;
/**
 * Get all alert rules
 */
getAlertRules();
AlertRule[];
{
    return Array.from(this.alertRules.values());
}
/**
 * Generate error report
 */
generateReport(timeWindow, number = 24);
{
    summary: ErrorMetrics;
    trends: any;
    recommendations: string[];
}
{
    const cutoff = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter(entry => entry.timestamp >= cutoff);
    const recommendations = [];
    // Analyze error patterns and generate recommendations
    if (this.currentMetrics.errorRate > 10) {
        recommendations.push('High error rate detected. Consider investigating system load and performance.');
    }
    if (this.currentMetrics.severityDistribution[error_1.ErrorSeverity.CRITICAL] > 0) {
        recommendations.push('Critical errors detected. Immediate attention required.');
    }
    if (this.currentMetrics.trends.increasing) {
        recommendations.push('Error rate is increasing. Monitor system health closely.');
    }
    return {
        summary: this.currentMetrics,
        trends: this.analyzeTrends(),
        recommendations
    };
}
/**
 * Shutdown the monitor
 */
shutdown();
void {
    : .metricsTimer
};
{
    clearInterval(this.metricsTimer);
    this.metricsTimer = undefined;
}
if (this.alertTimer) {
    clearInterval(this.alertTimer);
    this.alertTimer = undefined;
}
this.removeAllListeners();
this.logger.debug('ErrorMonitor shutdown complete');
initializeMetrics();
ErrorMetrics;
{
    return {
        totalErrors: 0,
        errorRate: 0,
        averageErrorRate: 0,
        categoryDistribution: {},
        severityDistribution: {},
        topErrorCodes: [],
        trends: {
            increasing: false,
            changeRate: 0,
            timeWindow: '1h'
        },
        healthScore: 100
    };
}
startMonitoring();
void {
    // Start metrics collection
    this: .metricsTimer = setInterval(() => {
        this.updateMetrics();
    }, this.config.metricsInterval),
    : .config.enableAlerting
};
{
    this.alertTimer = setInterval(() => {
        this.checkAlerts();
    }, this.config.alertInterval);
}
this.logger.info('Error monitoring started');
updateMetrics();
void {
    const: now = new Date(),
    const: oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000),
    const: recentErrors = this.errorHistory.filter(entry => entry.timestamp >= oneHourAgo),
    // Calculate basic metrics
    this: .currentMetrics.totalErrors = this.errorHistory.length,
    this: .currentMetrics.errorRate = recentErrors.length,
    // Calculate category distribution
    this: .currentMetrics.categoryDistribution = {},
    recentErrors, : .forEach(({ error }) => {
        this.currentMetrics.categoryDistribution[error.category] =
            (this.currentMetrics.categoryDistribution[error.category] || 0) + 1;
    }),
    // Calculate severity distribution
    this: .currentMetrics.severityDistribution = {},
    recentErrors, : .forEach(({ error }) => {
        this.currentMetrics.severityDistribution[error.severity] =
            (this.currentMetrics.severityDistribution[error.severity] || 0) + 1;
    }),
    // Calculate top error codes
    const: errorCodes
};
{ }
;
recentErrors.forEach(({ error }) => {
    errorCodes[error.code] = (errorCodes[error.code] || 0) + 1;
});
this.currentMetrics.topErrorCodes = Object.entries(errorCodes)
    .map(([code, count]) => ({
    code: parseInt(code),
    count,
    percentage: (count / recentErrors.length) * 100
}))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
// Calculate trends
this.currentMetrics.trends = this.analyzeTrends();
// Calculate health score
this.currentMetrics.healthScore = this.calculateHealthScore();
// Store metrics history
this.metricsHistory.push({
    metrics: { ...this.currentMetrics },
    timestamp: now
});
// Clean up old metrics
const cutoff = new Date(now.getTime() - this.config.retentionPeriod);
const initialLength = this.metricsHistory.length;
this.metricsHistory.splice(0, this.metricsHistory.findIndex(entry => entry.timestamp >= cutoff));
if (this.metricsHistory.length < initialLength) {
    this.logger.debug(Cleaned, up, $, { initialLength } - this.metricsHistory.length);
}
old;
metrics;
entries;
;
this.emit('metricsUpdated', this.currentMetrics);
analyzeTrends();
{
    increasing: boolean;
    changeRate: number;
    timeWindow: string;
}
{
    if (this.metricsHistory.length < 2) {
        return { increasing: false, changeRate: 0, timeWindow: '1h' };
    }
    const recent = this.metricsHistory.slice(-6); // Last 6 data points
    if (recent.length < 2) {
        return { increasing: false, changeRate: 0, timeWindow: '1h' };
    }
    const oldRate = recent[0].metrics.errorRate;
    const newRate = recent[recent.length - 1].metrics.errorRate;
    const changeRate = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;
    return {
        increasing: changeRate > 10, // 10% increase threshold
        changeRate,
        timeWindow: '1h'
    };
}
calculateHealthScore();
number;
{
    const weights = this.config.healthWeights;
    let score = 100;
    // Error rate impact (0-40 points)
    const errorRateImpact = Math.min(this.currentMetrics.errorRate * 2, 40);
    score -= errorRateImpact * weights.errorRate;
    // Severity impact (0-30 points)
    const criticalErrors = this.currentMetrics.severityDistribution[error_1.ErrorSeverity.CRITICAL] || 0;
    const highErrors = this.currentMetrics.severityDistribution[error_1.ErrorSeverity.HIGH] || 0;
    const severityImpact = Math.min(criticalErrors * 10 + highErrors * 5, 30);
    score -= severityImpact * weights.severity;
    // Trend impact (0-10 points)
    const trendImpact = this.currentMetrics.trends.increasing ?
        Math.min(Math.abs(this.currentMetrics.trends.changeRate) / 10, 10) : 0;
    score -= trendImpact * weights.trends;
    return Math.max(0, Math.min(100, score));
}
async;
checkAlerts();
Promise < void  > {
    const: now = new Date(),
    : .alertRules
};
{
    try {
        // Check cooldown
        if (rule.lastTriggered &&
            (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldown) {
            continue;
        }
        // Check condition
        const statistics = {
            totalErrors: this.currentMetrics.totalErrors,
            errorsByCategory: this.currentMetrics.categoryDistribution,
            errorsBySeverity: this.currentMetrics.severityDistribution,
            errorsByCode: {},
            errorRate: this.currentMetrics.errorRate,
            lastError: this.errorHistory.length > 0 ?
                this.errorHistory[this.errorHistory.length - 1].timestamp : undefined
        };
        if (rule.condition(this.currentMetrics, statistics)) {
            rule.lastTriggered = now;
            `
          this.logger.warn(Alert triggered: ${rule.name}`, {
                severity: rule.severity,
                description: rule.description
            };
            ;
            this.emit('alertTriggered', rule, this.currentMetrics, statistics);
            // Execute alert action
            await rule.action(this.currentMetrics, statistics);
        }
    }
    catch (error) {
        this.logger.error(Error, checking, alert, rule, $, { name }, error);
    }
}
cleanupHistory();
void {
    const: cutoff = new Date(Date.now() - this.config.retentionPeriod),
    const: initialLength = this.errorHistory.length,
    this: .errorHistory.splice(0, this.errorHistory.findIndex(entry => entry.timestamp >= cutoff))
} `
    `;
if (this.errorHistory.length < initialLength) {
    this.logger.debug(Cleaned, up, $, { initialLength } - this.errorHistory.length);
}
` old error entries);
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    // High error rate alert
    this.registerAlertRule({
      name: 'high-error-rate',
      description: 'Error rate exceeds threshold',
      severity: 'high',
      cooldown: 5 * 60 * 1000, // 5 minutes
      condition: (metrics) => metrics.errorRate > 20,
      action: async (metrics) => {
        this.logger.error(HIGH ERROR RATE ALERT: ${metrics.errorRate} errors in the last hour);
      }
    });

    // Critical error alert
    this.registerAlertRule({
      name: 'critical-errors',
      description: 'Critical errors detected',
      severity: 'critical',
      cooldown: 2 * 60 * 1000, // 2 minutes
      condition: (metrics) => (metrics.severityDistribution[ErrorSeverity.CRITICAL] || 0) > 0,`;
action: async (metrics) => {
    `
        const criticalCount = metrics.severityDistribution[ErrorSeverity.CRITICAL];
        this.logger.error(CRITICAL ERROR ALERT: ${criticalCount} critical errors detected`;
    ;
};
;
// Health score alert
this.registerAlertRule({
    name: 'low-health-score',
    description: 'System health score is low',
    severity: 'medium',
    cooldown: 10 * 60 * 1000, // 10 minutes
    condition: (metrics) => metrics.healthScore < 70,
    action: async (metrics) => {
        this.logger.warn(LOW, HEALTH, SCORE, ALERT, System, health, at, $, { metrics, : .healthScore } % `);
      }
    });
  }
});
    }
});
//# sourceMappingURL=ErrorMonitor.js.map