'use strict';
/**
 * Alert Manager
 * Manages alert rules and notifications
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.defaultAlertRules = exports.AlertManager = void 0;
const events_1 = require('events');
/**
 * Alert Manager Service
 */
class AlertManager extends events_1.EventEmitter {
  rules = new Map();
  activeAlerts = new Map();
  alertHistory = [];
  intervalId;
  config;
  metricsProvider;
  constructor(config) {
    super();
    this.config = config;
  }
  /**
   * Set metrics provider function
   */
  setMetricsProvider(provider) {
    this.metricsProvider = provider;
  }
  /**
   * Add an alert rule
   */
  addRule(rule) {
    this.rules.set(rule.id, rule);
    this.emit('ruleAdded', rule);
  }
  /**
   * Remove an alert rule
   */
  removeRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      this.emit('ruleRemoved', rule);
    }
  }
  /**
   * Update an alert rule
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      const updatedRule = { ...rule, ...updates };
      this.rules.set(ruleId, updatedRule);
      this.emit('ruleUpdated', updatedRule);
    }
  }
  /**
   * Get all rules
   */
  getRules() {
    return Array.from(this.rules.values());
  }
  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }
  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }
  /**
   * Start alert evaluation
   */
  start() {
    if (this.intervalId || !this.config.enabled) {
      return;
    }
    this.intervalId = setInterval(async () => {
      await this.evaluateRules();
    }, this.config.evaluationInterval);
    this.emit('started');
  }
  /**
   * Stop alert evaluation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.emit('stopped');
    }
  }
  /**
   * Evaluate all alert rules
   */
  async evaluateRules() {
    if (!this.metricsProvider) {
      return;
    }
    try {
      const metrics = await this.metricsProvider();
      for (const rule of this.rules.values()) {
        if (!rule.enabled) {
          continue;
        }
        await this.evaluateRule(rule, metrics);
      }
      // Auto-resolve old alerts
      if (this.config.autoResolveAfter) {
        this.autoResolveAlerts();
      }
    } catch (error) {
      console.error('Error evaluating alert rules:', error);
      this.emit('evaluationError', error);
    }
  }
  /**
   * Evaluate a single alert rule
   */
  async evaluateRule(rule, metrics) {
    const metricValue = metrics[rule.metric];
    if (metricValue === undefined) {
      return;
    }
    const conditionMet = this.evaluateCondition(metricValue, rule.operator, rule.threshold);
    const alertId = rule.id;
    const existingAlert = this.activeAlerts.get(alertId);
    if (conditionMet) {
      if (existingAlert) {
        // Update existing alert
        existingAlert.value = metricValue;
        existingAlert.lastEvaluatedAt = new Date();
        // Check if alert should fire
        if (existingAlert.status === 'pending') {
          const timeSinceFired = Date.now() - (existingAlert.firedAt?.getTime() || Date.now());
          if (timeSinceFired >= rule.duration) {
            this.fireAlert(existingAlert);
          }
        }
      } else {
        // Create new alert
        const newAlert = {
          id: alertId,
          rule,
          status: 'pending',
          value: metricValue,
          threshold: rule.threshold,
          firedAt: new Date(),
          lastEvaluatedAt: new Date(),
          notificationsSent: 0,
        };
        this.activeAlerts.set(alertId, newAlert);
        this.emit('alertPending', newAlert);
      }
    } else {
      // Condition not met, resolve alert if exists
      if (existingAlert && existingAlert.status === 'firing') {
        this.resolveAlert(existingAlert);
      } else if (existingAlert) {
        // Remove pending alert
        this.activeAlerts.delete(alertId);
      }
    }
  }
  /**
   * Evaluate a condition
   */
  evaluateCondition(value, operator, threshold) {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      case 'ne':
        return value !== threshold;
      default:
        return false;
    }
  }
  /**
   * Fire an alert
   */
  fireAlert(alert) {
    alert.status = 'firing';
    alert.firedAt = new Date();
    this.emit('alertFired', alert);
    // Execute alert actions
    if (alert.rule.actions) {
      for (const action of alert.rule.actions) {
        if (action.enabled) {
          this.executeAlertAction(alert, action);
        }
      }
    }
    alert.notificationsSent++;
  }
  /**
   * Resolve an alert
   */
  resolveAlert(alert) {
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    this.emit('alertResolved', alert);
    // Move to history
    this.alertHistory.push(alert);
    this.activeAlerts.delete(alert.id);
    // Keep only last 1000 alerts in history
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }
  /**
   * Auto-resolve old alerts
   */
  autoResolveAlerts() {
    const now = Date.now();
    for (const alert of this.activeAlerts.values()) {
      if (alert.status === 'firing' && alert.firedAt) {
        const age = now - alert.firedAt.getTime();
        if (age >= this.config.autoResolveAfter) {
          this.resolveAlert(alert);
        }
      }
    }
  }
  /**
   * Execute an alert action
   */
  executeAlertAction(alert, action) {
    this.emit('actionExecute', { alert, action });
    // Actual implementation would integrate with external services
    // This is a placeholder for the integration
    switch (action.type) {
      case 'email':
        this.emit('sendEmail', { alert, config: action.config });
        break;
      case 'slack':
        this.emit('sendSlack', { alert, config: action.config });
        break;
      case 'webhook':
        this.emit('sendWebhook', { alert, config: action.config });
        break;
      case 'pagerduty':
        this.emit('sendPagerDuty', { alert, config: action.config });
        break;
    }
  }
  /**
   * Manually trigger an alert
   */
  triggerAlert(ruleId, value, metadata) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return;
    }
    const alert = {
      id: ruleId,
      rule,
      status: 'firing',
      value,
      threshold: rule.threshold,
      firedAt: new Date(),
      lastEvaluatedAt: new Date(),
      notificationsSent: 0,
      metadata,
    };
    this.activeAlerts.set(ruleId, alert);
    this.fireAlert(alert);
  }
  /**
   * Manually resolve an alert
   */
  manualResolveAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      this.resolveAlert(alert);
    }
  }
}
exports.AlertManager = AlertManager;
/**
 * Default alert rules for common scenarios
 */
exports.defaultAlertRules = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Error rate exceeds 5% of total requests',
    metric: 'http_error_rate',
    operator: 'gt',
    threshold: 5,
    duration: 300000, // 5 minutes
    severity: 'critical',
    enabled: true,
    annotations: {
      summary: 'High error rate detected',
      description: 'The error rate has exceeded 5% for more than 5 minutes',
    },
  },
  {
    id: 'slow-response-time',
    name: 'Slow Response Time',
    description: 'Average response time exceeds 2 seconds',
    metric: 'http_response_time_avg',
    operator: 'gt',
    threshold: 2000,
    duration: 300000, // 5 minutes
    severity: 'warning',
    enabled: true,
    annotations: {
      summary: 'Slow response time detected',
      description: 'The average response time has exceeded 2 seconds',
    },
  },
  {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'Memory usage exceeds 90%',
    metric: 'memory_usage_percent',
    operator: 'gt',
    threshold: 90,
    duration: 300000, // 5 minutes
    severity: 'critical',
    enabled: true,
    annotations: {
      summary: 'High memory usage detected',
      description: 'Memory usage has exceeded 90%',
    },
  },
  {
    id: 'high-cpu-usage',
    name: 'High CPU Usage',
    description: 'CPU usage exceeds 80%',
    metric: 'cpu_usage_percent',
    operator: 'gt',
    threshold: 80,
    duration: 300000, // 5 minutes
    severity: 'warning',
    enabled: true,
    annotations: {
      summary: 'High CPU usage detected',
      description: 'CPU usage has exceeded 80%',
    },
  },
  {
    id: 'database-connection-pool-exhausted',
    name: 'Database Connection Pool Exhausted',
    description: 'Database connection pool is near exhaustion',
    metric: 'database_pool_utilization',
    operator: 'gt',
    threshold: 90,
    duration: 60000, // 1 minute
    severity: 'critical',
    enabled: true,
    annotations: {
      summary: 'Database connection pool near exhaustion',
      description: 'Connection pool utilization exceeds 90%',
    },
  },
  {
    id: 'slow-database-queries',
    name: 'Slow Database Queries',
    description: 'Database query time exceeds 5 seconds',
    metric: 'database_query_time_p95',
    operator: 'gt',
    threshold: 5000,
    duration: 300000, // 5 minutes
    severity: 'warning',
    enabled: true,
    annotations: {
      summary: 'Slow database queries detected',
      description: 'P95 query time exceeds 5 seconds',
    },
  },
  {
    id: 'websocket-connection-surge',
    name: 'WebSocket Connection Surge',
    description: 'WebSocket connections increased by more than 50%',
    metric: 'websocket_connections_change_percent',
    operator: 'gt',
    threshold: 50,
    duration: 60000, // 1 minute
    severity: 'warning',
    enabled: true,
    annotations: {
      summary: 'WebSocket connection surge detected',
      description: 'WebSocket connections increased significantly',
    },
  },
  {
    id: 'failed-job-rate',
    name: 'High Failed Job Rate',
    description: 'Job failure rate exceeds 10%',
    metric: 'job_failure_rate',
    operator: 'gt',
    threshold: 10,
    duration: 300000, // 5 minutes
    severity: 'error',
    enabled: true,
    annotations: {
      summary: 'High job failure rate detected',
      description: 'More than 10% of jobs are failing',
    },
  },
];
//# sourceMappingURL=alert-manager.js.map
