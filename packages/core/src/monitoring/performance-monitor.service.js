"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitorService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
let PerformanceMonitorService = class PerformanceMonitorService {
    logger;
    metrics = new Map();
    alerts = new Map();
    monitoring_rules = new Map();
    reports = new Map();
    collection_intervals = new Map();
    stats;
    metric_buffers = new Map();
    last_collection_time = new Date();
    constructor(logger) {
        this.logger = logger;
        this.initializeStats();
        this.initializeDefaultRules();
        this.startMetricCollection();
        this.startBackgroundTasks();
        this.logger.log('PerformanceMonitorService initialized', 'PerformanceMonitorService');
    }
    /**
     * Initialize monitoring statistics
     */
    initializeStats() {
        this.stats = {
            total_metrics_collected: 0,
            metrics_per_second: 0,
            alerts_active: 0,
            alerts_resolved_24h: 0,
            monitoring_rules_active: 0,
            data_retention_days: 30,
            storage_usage_mb: 0,
            collection_latency_ms: 0,
            uptime_percentage: 100
        };
    }
    /**
     * Initialize default monitoring rules
     */
    initializeDefaultRules() {
        const default_rules = [
            {
                name: 'High CPU Usage',
                description: 'Monitor CPU usage above threshold',
                metric_pattern: 'cpu.*',
                threshold: {
                    warning: 70,
                    critical: 90,
                    operator: 'greater_than',
                    enabled: true
                },
                actions: [
                    {
                        type: 'notification',
                        configuration: { channel: 'performance-alerts' },
                        delay: 0
                    },
                    {
                        type: 'log',
                        configuration: { level: 'warning' },
                        delay: 0
                    }
                ],
                enabled: true
            },
            {
                name: 'High Memory Usage',
                description: 'Monitor memory usage above threshold',
                metric_pattern: 'memory.*',
                threshold: {
                    warning: 80,
                    critical: 95,
                    operator: 'greater_than',
                    enabled: true
                },
                actions: [
                    {
                        type: 'notification',
                        configuration: { channel: 'performance-alerts' },
                        delay: 0
                    }
                ],
                enabled: true
            },
            {
                name: 'Slow Response Time',
                description: 'Monitor application response times',
                metric_pattern: 'response_time.*',
                threshold: {
                    warning: 1000,
                    critical: 5000,
                    operator: 'greater_than',
                    enabled: true
                },
                actions: [
                    {
                        type: 'notification',
                        configuration: { channel: 'performance-alerts' },
                        delay: 0
                    }
                ],
                enabled: true
            },
            {
                name: 'Low Disk Space',
                description: 'Monitor available disk space',
                metric_pattern: 'disk.free_space.*',
                threshold: {
                    warning: 20,
                    critical: 10,
                    operator: 'less_than',
                    enabled: true
                },
                actions: [
                    {
                        type: 'notification',
                        configuration: { channel: 'infrastructure-alerts' },
                        delay: 0
                    }
                ],
                enabled: true
            }
        ];
        default_rules.forEach(rule => {
            const rule_id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)};
      const full_rule: MonitoringRule = {
        ...rule,
        id: rule_id,
        created_at: new Date(),
        last_triggered: new Date(0),
        trigger_count: 0
      };
      this.monitoring_rules.set(rule_id, full_rule);
    });

    this.stats.monitoring_rules_active = this.monitoring_rules.size;
  }

  /**
   * Collect a performance metric
   */
  async collectMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<string> {`;
            const metric_id = metric_$, { Date, now };
            ();
        }, `_${Math.random().toString(36).substr(2, 9)}`);
        const full_metric = {
            ...metric,
            id: metric_id,
            timestamp: new Date()
        };
        // Store metric
        const metric_key = $, { metric, category }, $, { metric, name };
        if (!this.metrics.has(metric_key)) {
            this.metrics.set(metric_key, []);
        }
        const metric_history = this.metrics.get(metric_key);
        metric_history.push(full_metric);
        // Maintain history limit (keep last 1000 metrics per type)
        if (metric_history.length > 1000) {
            metric_history.splice(0, metric_history.length - 1000);
        }
        // Buffer for batch processing
        if (!this.metric_buffers.has(metric_key)) {
            this.metric_buffers.set(metric_key, []);
        }
        this.metric_buffers.get(metric_key).push(full_metric);
        this.stats.total_metrics_collected++;
        // Check against monitoring rules
        await this.evaluateMetricAgainstRules(full_metric);
        `
    this.logger.log(`;
        Metric;
        collected: $;
        {
            metric.name;
        }
        $;
        {
            metric.value;
        }
        $;
        {
            metric.unit;
        }
        `, 'PerformanceMonitorService');
    return metric_id;
  }

  /**
   * Evaluate metric against monitoring rules
   */
  private async evaluateMetricAgainstRules(metric: PerformanceMetric): Promise<void> {
    for (const rule of this.monitoring_rules.values()) {
      if (!rule.enabled) continue;

      // Check if metric matches pattern
      const metric_path = ${metric.category}.${metric.name};
      if (!this.matchesPattern(metric_path, rule.metric_pattern)) continue;

      // Check threshold
      const threshold_violation = this.checkThreshold(metric.value, rule.threshold);
      if (!threshold_violation) continue;

      // Create alert
      await this.createPerformanceAlert(metric, rule, threshold_violation);

      // Execute actions
      await this.executeRuleActions(rule, metric);

      // Update rule statistics
      rule.last_triggered = new Date();
      rule.trigger_count++;
    }
  }

  /**
   * Check if metric path matches pattern
   */
  private matchesPattern(metric_path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex_pattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');` `
    const regex = new RegExp(^${regex_pattern}`;
        $;
        ;
        return regex.test(metric_path);
    }
    /**
     * Check if value violates threshold
     */
    checkThreshold(value, threshold) {
        if (!threshold.enabled)
            return null;
        switch (threshold.operator) {
            case 'greater_than':
                if (value > threshold.critical)
                    return 'critical';
                if (value > threshold.warning)
                    return 'warning';
                break;
            case 'less_than':
                if (value < threshold.critical)
                    return 'critical';
                if (value < threshold.warning)
                    return 'warning';
                break;
            case 'equals':
                if (value === threshold.critical)
                    return 'critical';
                if (value === threshold.warning)
                    return 'warning';
                break;
        }
        return null;
    }
    /**
     * Create performance alert
     */
    async createPerformanceAlert(metric, rule, severity) {
        const alert_id = alert_$, { Date, now };
        ();
    }
    _$;
};
exports.PerformanceMonitorService = PerformanceMonitorService;
exports.PerformanceMonitorService = PerformanceMonitorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], PerformanceMonitorService);
{
    Math.random().toString(36).substr(2, 9);
}
;
const threshold_value = severity === 'critical' ? rule.threshold.critical : rule.threshold.warning;
const alert = {
    id: alert_id,
    metric_id: metric.id,
} `
      severity,`;
title: `${rule.name} - ${severity.toUpperCase()},`;
message: $;
{
    metric.name;
}
value;
$;
{
    metric.value;
}
` ${metric.unit} violates ${severity} threshold ${threshold_value} ${metric.unit}`,
    triggered_at;
new Date(),
    current_value;
metric.value,
    threshold_value,
    metadata;
{
    rule_id: rule.id,
        metric_category;
    metric.category,
        metric_source;
    metric.source,
        metric_tags;
    metric.tags;
}
;
this.alerts.set(alert_id, alert);
this.stats.alerts_active++;
this.logger.log(Performance, alert, created, $, { severity } - $, { rule, : .name }($, { metric, : .value }, $, { metric, : .unit }), 'PerformanceMonitorService');
return alert_id;
async;
executeRuleActions(rule, MonitoringRule, metric, PerformanceMetric);
Promise < void  > {
    for(, action, of, rule) { }, : .actions
};
{
    try {
        // Apply delay if specified
        if (action.delay > 0) {
            setTimeout(async () => {
                await this.executeAction(action, metric, rule);
            }, action.delay);
        }
        else {
            `
          await this.executeAction(action, metric, rule);`;
        }
        `
      } catch (error) {
        this.logger.error(Failed to execute action: ${action.type}, error instanceof Error ? error : new Error(String(error)), 'PerformanceMonitorService');
      }
    }
  }

  /**
   * Execute individual action
   */
  private async executeAction(action: AlertAction, metric: PerformanceMetric, rule: MonitoringRule): Promise<void> {
    switch (action.type) {
      case 'notification':`;
        this.logger.log(NOTIFICATION, $, { rule, : .name }, triggered);
        for ($; { metric, : .name }, 'PerformanceMonitorService';)
            ;
        `
        break;`;
        'webhook';
        this.logger.log(WEBHOOK, Sending, alert);
        for ($; { metric, : .name }; to)
            $;
        {
            action.configuration.url;
        }
        `, 'PerformanceMonitorService');
        break;
      case 'email':
        this.logger.log(EMAIL: Sending alert for ${metric.name} to ${action.configuration.recipients}, 'PerformanceMonitorService');`;
        break;
        `
      case 'auto_scale':
        this.logger.log(AUTO_SCALE: Scaling ${action.configuration.target}`;
        for ($; { metric, : .name }, 'PerformanceMonitorService';)
            ;
        break;
        `
      case 'restart':`;
        this.logger.log(RESTART, Restarting, $, { action, : .configuration.service }, due, to, $, { metric, : .name }, 'PerformanceMonitorService');
        break;
        'log';
        `
        this.logger.log(`;
        RULE_LOG: $;
        {
            rule.name;
        }
        -$;
        {
            metric.name;
        }
        $;
        {
            metric.value;
        }
        $;
        {
            metric.unit;
        }
        'PerformanceMonitorService';
        ;
        break;
    }
    finally {
    }
}
startMetricCollection();
void {
    // System metrics collection
    const: system_interval = setInterval(async () => {
        await this.collectSystemMetrics();
    }, 30000), // Every 30 seconds
    this: .collection_intervals.set('system', system_interval),
    // Application metrics collection
    const: app_interval = setInterval(async () => {
        await this.collectApplicationMetrics();
    }, 60000), // Every minute
    this: .collection_intervals.set('application', app_interval)
};
async;
collectSystemMetrics();
Promise < void  > {
    const: start_time = Date.now(),
    try: {
        // CPU metrics
        const: cpu_usage = this.getCPUUsage(),
        await, this: .collectMetric({
            name: 'cpu_usage',
            category: 'cpu',
            value: cpu_usage,
            unit: 'percentage',
            source: 'system',
            tags: { component: 'cpu', type: 'usage' }
        }),
        // Memory metrics
        const: memory_usage = this.getMemoryUsage(),
        await, this: .collectMetric({
            name: 'memory_usage',
            category: 'memory',
            value: memory_usage.percentage,
            unit: 'percentage',
            source: 'system',
            tags: { component: 'memory', type: 'usage' }
        }),
        await, this: .collectMetric({
            name: 'memory_used',
            category: 'memory',
            value: memory_usage.used_mb,
            unit: 'megabytes',
            source: 'system',
            tags: { component: 'memory', type: 'absolute' }
        }),
        // Disk metrics
        const: disk_usage = this.getDiskUsage(),
        await, this: .collectMetric({
            name: 'disk_usage',
            category: 'disk',
            value: disk_usage.percentage,
            unit: 'percentage',
            source: 'system',
            tags: { component: 'disk', type: 'usage' }
        }),
        const: collection_time = Date.now() - start_time,
        this: .stats.collection_latency_ms = collection_time
    }, catch(error) {
        this.logger.error('Failed to collect system metrics', error instanceof Error ? error : new Error(String(error)), 'PerformanceMonitorService');
    }
};
async;
collectApplicationMetrics();
Promise < void  > {
    try: {
        // Response time simulation
        const: response_time = Math.random() * 500 + 100, // 100-600ms
        await, this: .collectMetric({
            name: 'response_time',
            category: 'application',
            value: response_time,
            unit: 'milliseconds',
            source: 'application',
            tags: { component: 'api', endpoint: 'average' }
        }),
        // Request count simulation
        const: request_count = Math.floor(Math.random() * 100) + 50, // 50-150 requests
        await, this: .collectMetric({
            name: 'request_count',
            category: 'application',
            value: request_count,
            unit: 'count',
            source: 'application',
            tags: { component: 'api', type: 'requests' }
        }),
        // Error rate simulation
        const: error_rate = Math.random() * 5, // 0-5% error rate
        await, this: .collectMetric({
            name: 'error_rate',
            category: 'application',
            value: error_rate,
            unit: 'percentage',
            source: 'application',
            tags: { component: 'api', type: 'errors' }
        })
    }, catch(error) {
        this.logger.error('Failed to collect application metrics', error instanceof Error ? error : new Error(String(error)), 'PerformanceMonitorService');
    }
};
getCPUUsage();
number;
{
    // Simulate CPU usage between 10-90%
    return Math.random() * 80 + 10;
}
getMemoryUsage();
{
    percentage: number;
    used_mb: number;
    total_mb: number;
}
{
    const total_mb = 8192; // 8GB
    const used_mb = Math.random() * 6144 + 1024; // 1-7GB used
    const percentage = (used_mb / total_mb) * 100;
    return { percentage, used_mb, total_mb };
}
getDiskUsage();
{
    percentage: number;
    used_gb: number;
    total_gb: number;
}
{
    const total_gb = 500; // 500GB
    const used_gb = Math.random() * 400 + 50; // 50-450GB used
    const percentage = (used_gb / total_gb) * 100;
    return { percentage, used_gb, total_gb };
}
startBackgroundTasks();
void {
    // Metrics per second calculation
    setInterval() { }
}();
{
    const now = new Date();
    const time_diff = (now.getTime() - this.last_collection_time.getTime()) / 1000;
    let total_new_metrics = 0;
    for (const buffer of this.metric_buffers.values()) {
        total_new_metrics += buffer.length;
    }
    this.stats.metrics_per_second = time_diff > 0 ? total_new_metrics / time_diff : 0;
    // Clear buffers
    this.metric_buffers.clear();
    this.last_collection_time = now;
}
10000;
; // Every 10 seconds
// Alert cleanup
setInterval(() => {
    this.cleanupResolvedAlerts();
}, 3600000); // Every hour
// Storage usage calculation
setInterval(() => {
    this.calculateStorageUsage();
}, 300000); // Every 5 minutes
cleanupResolvedAlerts();
void {
    const: cutoff_time = Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
    let, cleaned_count = 0,
    : .alerts.entries()
};
{
    if (alert.resolved_at && alert.resolved_at.getTime() < cutoff_time) {
        this.alerts.delete(alert_id);
        cleaned_count++;
    }
    `
    }`;
    if (cleaned_count > 0) {
        `
      this.stats.alerts_resolved_24h += cleaned_count;
      this.logger.log(Cleaned up ${cleaned_count} resolved alerts, 'PerformanceMonitorService');
    }
  }

  /**
   * Calculate storage usage
   */
  private calculateStorageUsage(): void {
    let total_metrics = 0;
    for (const metric_history of this.metrics.values()) {
      total_metrics += metric_history.length;
    }

    // Estimate ~1KB per metric
    this.stats.storage_usage_mb = (total_metrics * 1024) / (1024 * 1024);
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: MetricCategory, limit: number = 100): PerformanceMetric[] {
    const category_metrics: PerformanceMetric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith(category)) {
        category_metrics.push(...metrics.slice(-limit));
      }
    }

    return category_metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get metrics by time range
   */
  getMetricsByTimeRange(start: Date, end: Date, metric_name?: string): PerformanceMetric[] {
    const filtered_metrics: PerformanceMetric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (metric_name && !key.includes(metric_name)) continue;

      const time_filtered = metrics.filter(
        metric => metric.timestamp >= start && metric.timestamp <= end
      );
      filtered_metrics.push(...time_filtered);
    }

    return filtered_metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get current alerts
   */
  getCurrentAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved_at);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alert_id: string): Promise<boolean> {
    const alert = this.alerts.get(alert_id);
    if (!alert || alert.resolved_at) {
      return false;
    }

    alert.resolved_at = new Date();
    this.stats.alerts_active = Math.max(0, this.stats.alerts_active - 1);` `
    this.logger.log(Alert resolved: ${alert_id}, 'PerformanceMonitorService');
    return true;
  }

  /**
   * Add monitoring rule
   */
  addMonitoringRule(rule: Omit<MonitoringRule, 'id' | 'created_at' | 'last_triggered' | 'trigger_count'>): string {`;
        const rule_id = rule_$, { Date, now };
        ();
    }
    `_${Math.random().toString(36).substr(2, 6)};
    
    const full_rule: MonitoringRule = {
      ...rule,
      id: rule_id,
      created_at: new Date(),
      last_triggered: new Date(0),
      trigger_count: 0
    };

    this.monitoring_rules.set(rule_id, full_rule);
    this.stats.monitoring_rules_active = this.monitoring_rules.size;

    this.logger.log(Monitoring rule added: ${rule.name}, 'PerformanceMonitorService');
    return rule_id;
  }

  /**
   * Remove monitoring rule
   */
  removeMonitoringRule(rule_id: string): boolean {
    const removed = this.monitoring_rules.delete(rule_id);`;
    if (removed) {
        `
      this.stats.monitoring_rules_active = this.monitoring_rules.size;
      this.logger.log(`;
        Monitoring;
        rule;
        removed: $;
        {
            rule_id;
        }
        'PerformanceMonitorService';
        ;
    }
    return removed;
}
/**
 * Generate performance report
 */
async;
generateReport(name, string, description, string, time_range, TimeRange, `
    format: 'json' | 'pdf' | 'html' | 'csv' = 'json'`);
Promise < string > {
    const: report_id = report_$
};
{
    Date.now();
}
`_${Math.random().toString(36).substr(2, 9)};

    // Get metrics for time range
    const metrics = this.getMetricsByTimeRange(time_range.start, time_range.end);

    // Generate summary
    const summary = this.generatePerformanceSummary(metrics);

    // Generate chart configurations
    const charts = this.generateDefaultCharts(time_range);

    const report: PerformanceReport = {
      id: report_id,
      name,
      description,
      time_range,
      metrics,
      summary,
      charts,
      generated_at: new Date(),
      format
    };
`;
this.reports.set(report_id, report);
`

    this.logger.log(Performance report generated: ${name}`($, { report_id }) `, 'PerformanceMonitorService');
    return report_id;
  }

  /**
   * Generate performance summary
   */
  private generatePerformanceSummary(metrics: PerformanceMetric[]): PerformanceSummary {
    const metrics_by_category: Record<MetricCategory, number> = {
      cpu: 0, memory: 0, disk: 0, network: 0, database: 0,
      application: 0, user_experience: 0, business: 0, security: 0, availability: 0
    };

    for (const metric of metrics) {
      metrics_by_category[metric.category]++;
    }

    // Calculate average performance score (simplified)
    const performance_scores = metrics
      .filter(m => ['cpu', 'memory', 'application'].includes(m.category))
      .map(m => Math.max(0, 100 - m.value)); // Invert for score calculation

    const average_performance_score = performance_scores.length > 0 ?
      performance_scores.reduce((sum, score) => sum + score, 0) / performance_scores.length : 100;

    return {
      total_metrics: metrics.length,
      metrics_by_category,
      alerts_triggered: this.stats.alerts_active,
      average_performance_score,
      worst_performing_components: [],
      best_performing_components: [],
      trends: []
    };
  }

  /**
   * Generate default chart configurations
   */
  private generateDefaultCharts(time_range: TimeRange): ChartConfig[] {
    return [
      {
        id: 'cpu_usage_chart',
        title: 'CPU Usage Over Time',
        type: 'line',
        metrics: ['cpu.cpu_usage'],
        time_range,
        aggregation: 'avg'
      },
      {
        id: 'memory_usage_chart',
        title: 'Memory Usage Over Time',
        type: 'line',
        metrics: ['memory.memory_usage'],
        time_range,
        aggregation: 'avg'
      },
      {
        id: 'response_time_chart',
        title: 'Application Response Time',
        type: 'line',
        metrics: ['application.response_time'],
        time_range,
        aggregation: 'avg'
      }
    ];
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): PerformanceMonitorStats {
    // Update active alerts count
    this.stats.alerts_active = Array.from(this.alerts.values()).filter(alert => !alert.resolved_at).length;
    
    return { ...this.stats };
  }

  /**
   * Get all monitoring rules
   */
  getMonitoringRules(): MonitoringRule[] {
    return Array.from(this.monitoring_rules.values());
  }

  /**
   * Get report by ID
   */
  getReport(report_id: string): PerformanceReport | null {
    return this.reports.get(report_id) || null;
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const stats = this.getMonitoringStats();
    const critical_alerts = Array.from(this.alerts.values())
      .filter(alert => !alert.resolved_at && alert.severity === 'critical').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (critical_alerts > 0 || stats.collection_latency_ms > 10000) {
      status = 'unhealthy';
    } else if (stats.alerts_active > 5 || stats.collection_latency_ms > 5000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      details: {
        total_metrics_collected: stats.total_metrics_collected,
        metrics_per_second: stats.metrics_per_second,
        alerts_active: stats.alerts_active,
        critical_alerts,
        monitoring_rules_active: stats.monitoring_rules_active,
        collection_latency_ms: stats.collection_latency_ms,
        storage_usage_mb: stats.storage_usage_mb,
        uptime_percentage: stats.uptime_percentage
      }
    };
  }
}

export default PerformanceMonitorService;
;
//# sourceMappingURL=performance-monitor.service.js.map