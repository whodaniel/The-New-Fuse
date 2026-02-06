/**
 * Error Monitoring and Metrics Collection System
 */

import { EventEmitter } from 'events';
import { ErrorCategory, ErrorSeverity, ErrorStatistics, MCPErrorClass } from '../types/error';
import { Logger } from '../utils/Logger';

export interface ErrorMetrics {
  /** Total error count */
  totalErrors: number;
  /** Error rate (errors per minute) */
  errorRate: number;
  /** Average error rate over time */
  averageErrorRate: number;
  /** Error distribution by category */
  categoryDistribution: Record<ErrorCategory, number>;
  /** Error distribution by severity */
  severityDistribution: Record<ErrorSeverity, number>;
  /** Top error codes */
  topErrorCodes: Array<{ code: number; count: number; percentage: number }>;
  /** Error trends */
  trends: {
    increasing: boolean;
    changeRate: number;
    timeWindow: string;
  };
  /** System health score (0-100) */
  healthScore: number;
}

export interface AlertRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Condition function */
  condition: (metrics: ErrorMetrics, statistics: ErrorStatistics) => boolean;
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Cooldown period (ms) */
  cooldown: number;
  /** Last triggered timestamp */
  lastTriggered?: Date;
  /** Alert action */
  action: (metrics: ErrorMetrics, statistics: ErrorStatistics) => Promise<void>;
}

export interface MonitorConfig {
  /** Metrics collection interval (ms) */
  metricsInterval: number;
  /** Error history retention period (ms) */
  retentionPeriod: number;
  /** Enable alerting */
  enableAlerting: boolean;
  /** Alert check interval (ms) */
  alertInterval: number;
  /** Health score calculation weights */
  healthWeights: {
    errorRate: number;
    severity: number;
    recovery: number;
    trends: number;
  };
}

/**
 * Error monitoring system
 */
export class ErrorMonitor extends EventEmitter {
  private readonly config: MonitorConfig;
  private readonly logger: Logger;
  private readonly errorHistory: Array<{ error: MCPErrorClass; timestamp: Date }> = [];
  private readonly alertRules: Map<string, AlertRule> = new Map();
  private readonly metricsHistory: Array<{ metrics: ErrorMetrics; timestamp: Date }> = [];

  private metricsTimer?: NodeJS.Timeout;
  private alertTimer?: NodeJS.Timeout;
  private currentMetrics: ErrorMetrics;

  constructor(config: Partial<MonitorConfig> = {}, logger?: Logger) {
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
        trends: 0.1,
      },
      ...config,
    };

    this.logger = logger || new Logger('ErrorMonitor');

    this.currentMetrics = this.initializeMetrics();
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * Record an error occurrence
   */
  recordError(error: MCPErrorClass): void {
    const timestamp = new Date();
    this.errorHistory.push({ error, timestamp });

    // Clean up old entries
    this.cleanupHistory();

    // Update metrics immediately for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.updateMetrics();
    }

    this.emit('errorRecorded', error, timestamp);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ErrorMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): Array<{ metrics: ErrorMetrics; timestamp: Date }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter((entry) => entry.timestamp >= cutoff);
  }

  /**
   * Register an alert rule
   */
  registerAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.name, rule);
    this.logger.debug(`Registered alert rule: ${rule.name}`);
  }

  /**
   * Remove an alert rule
   */
  removeAlertRule(name: string): boolean {
    const removed = this.alertRules.delete(name);
    if (removed) {
      this.logger.debug(`Removed alert rule: ${name}`);
    }
    return removed;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Generate error report
   */
  generateReport(timeWindow: number = 24): {
    summary: ErrorMetrics;
    trends: any;
    recommendations: string[];
  } {
    const cutoff = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter((entry) => entry.timestamp >= cutoff);

    const recommendations: string[] = [];

    // Analyze error patterns and generate recommendations
    if (this.currentMetrics.errorRate > 10) {
      recommendations.push(
        'High error rate detected. Consider investigating system load and performance.'
      );
    }

    if (this.currentMetrics.severityDistribution[ErrorSeverity.CRITICAL] > 0) {
      recommendations.push('Critical errors detected. Immediate attention required.');
    }

    if (this.currentMetrics.trends.increasing) {
      recommendations.push('Error rate is increasing. Monitor system health closely.');
    }

    return {
      summary: this.currentMetrics,
      trends: this.analyzeTrends(),
      recommendations,
    };
  }

  /**
   * Shutdown the monitor
   */
  shutdown(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.alertTimer) {
      clearInterval(this.alertTimer);
      this.alertTimer = undefined;
    }

    this.removeAllListeners();
    this.logger.debug('ErrorMonitor shutdown complete');
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorRate: 0,
      averageErrorRate: 0,
      categoryDistribution: {} as Record<ErrorCategory, number>,
      severityDistribution: {} as Record<ErrorSeverity, number>,
      topErrorCodes: [],
      trends: {
        increasing: false,
        changeRate: 0,
        timeWindow: '1h',
      },
      healthScore: 100,
    };
  }

  /**
   * Start monitoring timers
   */
  private startMonitoring(): void {
    // Start metrics collection
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsInterval);

    // Start alert checking
    if (this.config.enableAlerting) {
      this.alertTimer = setInterval(() => {
        this.checkAlerts();
      }, this.config.alertInterval);
    }

    this.logger.info('Error monitoring started');
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter((entry) => entry.timestamp >= oneHourAgo);

    // Calculate basic metrics
    this.currentMetrics.totalErrors = this.errorHistory.length;
    this.currentMetrics.errorRate = recentErrors.length;

    // Calculate category distribution
    this.currentMetrics.categoryDistribution = {} as Record<ErrorCategory, number>;
    recentErrors.forEach(({ error }) => {
      this.currentMetrics.categoryDistribution[error.category] =
        (this.currentMetrics.categoryDistribution[error.category] || 0) + 1;
    });

    // Calculate severity distribution
    this.currentMetrics.severityDistribution = {} as Record<ErrorSeverity, number>;
    recentErrors.forEach(({ error }) => {
      this.currentMetrics.severityDistribution[error.severity] =
        (this.currentMetrics.severityDistribution[error.severity] || 0) + 1;
    });

    // Calculate top error codes
    const errorCodes: Record<number, number> = {};
    recentErrors.forEach(({ error }) => {
      errorCodes[error.code] = (errorCodes[error.code] || 0) + 1;
    });

    this.currentMetrics.topErrorCodes = Object.entries(errorCodes)
      .map(([code, count]) => ({
        code: parseInt(code),
        count,
        percentage: (count / recentErrors.length) * 100,
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
      timestamp: now,
    });

    // Clean up old metrics
    const cutoff = new Date(now.getTime() - this.config.retentionPeriod);
    const initialLength = this.metricsHistory.length;
    this.metricsHistory.splice(
      0,
      this.metricsHistory.findIndex((entry) => entry.timestamp >= cutoff)
    );

    if (this.metricsHistory.length < initialLength) {
      this.logger.debug(
        `Cleaned up ${initialLength - this.metricsHistory.length} old metrics entries`
      );
    }

    this.emit('metricsUpdated', this.currentMetrics);
  }

  /**
   * Analyze error trends
   */
  private analyzeTrends(): { increasing: boolean; changeRate: number; timeWindow: string } {
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
      timeWindow: '1h',
    };
  }

  /**
   * Calculate system health score
   */
  private calculateHealthScore(): number {
    const weights = this.config.healthWeights;
    let score = 100;

    // Error rate impact (0-40 points)
    const errorRateImpact = Math.min(this.currentMetrics.errorRate * 2, 40);
    score -= errorRateImpact * weights.errorRate;

    // Severity impact (0-30 points)
    const criticalErrors = this.currentMetrics.severityDistribution[ErrorSeverity.CRITICAL] || 0;
    const highErrors = this.currentMetrics.severityDistribution[ErrorSeverity.HIGH] || 0;
    const severityImpact = Math.min(criticalErrors * 10 + highErrors * 5, 30);
    score -= severityImpact * weights.severity;

    // Trend impact (0-10 points)
    const trendImpact = this.currentMetrics.trends.increasing
      ? Math.min(Math.abs(this.currentMetrics.trends.changeRate) / 10, 10)
      : 0;
    score -= trendImpact * weights.trends;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check alert rules
   */
  private async checkAlerts(): Promise<void> {
    const now = new Date();

    for (const [name, rule] of this.alertRules) {
      try {
        // Check cooldown
        if (rule.lastTriggered && now.getTime() - rule.lastTriggered.getTime() < rule.cooldown) {
          continue;
        }

        // Check condition
        const statistics: ErrorStatistics = {
          totalErrors: this.currentMetrics.totalErrors,
          errorsByCategory: this.currentMetrics.categoryDistribution,
          errorsBySeverity: this.currentMetrics.severityDistribution,
          errorsByCode: {},
          errorRate: this.currentMetrics.errorRate,
          lastError:
            this.errorHistory.length > 0
              ? this.errorHistory[this.errorHistory.length - 1].timestamp
              : undefined,
        };

        if (rule.condition(this.currentMetrics, statistics)) {
          rule.lastTriggered = now;

          this.logger.warn(`Alert triggered: ${rule.name}`, {
            severity: rule.severity,
            description: rule.description,
          });

          this.emit('alertTriggered', rule, this.currentMetrics, statistics);

          // Execute alert action
          await rule.action(this.currentMetrics, statistics);
        }
      } catch (error) {
        this.logger.error(`Error checking alert rule ${name}:`, error);
      }
    }
  }

  /**
   * Clean up old error history
   */
  private cleanupHistory(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    const initialLength = this.errorHistory.length;

    this.errorHistory.splice(
      0,
      this.errorHistory.findIndex((entry) => entry.timestamp >= cutoff)
    );

    if (this.errorHistory.length < initialLength) {
      this.logger.debug(`Cleaned up ${initialLength - this.errorHistory.length} old error entries`);
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
        this.logger.error(`HIGH ERROR RATE ALERT: ${metrics.errorRate} errors in the last hour`);
      },
    });

    // Critical error alert
    this.registerAlertRule({
      name: 'critical-errors',
      description: 'Critical errors detected',
      severity: 'critical',
      cooldown: 2 * 60 * 1000, // 2 minutes
      condition: (metrics) => (metrics.severityDistribution[ErrorSeverity.CRITICAL] || 0) > 0,
      action: async (metrics) => {
        const criticalCount = metrics.severityDistribution[ErrorSeverity.CRITICAL];
        this.logger.error(`CRITICAL ERROR ALERT: ${criticalCount} critical errors detected`);
      },
    });

    // Health score alert
    this.registerAlertRule({
      name: 'low-health-score',
      description: 'System health score is low',
      severity: 'medium',
      cooldown: 10 * 60 * 1000, // 10 minutes
      condition: (metrics) => metrics.healthScore < 70,
      action: async (metrics) => {
        this.logger.warn(`LOW HEALTH SCORE ALERT: System health at ${metrics.healthScore}%`);
      },
    });
  }
}
