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
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("./LoggingService");
let MonitoringService = class MonitoringService {
    logger;
    metrics = new Map();
    alerts = new Map();
    dashboards = new Map();
    health_checks = new Map();
    monitoring_interval;
    constructor(logger) {
        this.logger = logger;
        this.logger.log('MonitoringService initialized', 'MonitoringService');
        this.initializeDefaultAlerts();
        this.startMonitoring();
    }
    async recordMetric(name, value, type, labels = {}, options = {}) {
        const metric = {
            id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      name,
      type,
      value,
      labels,
      timestamp: new Date(),
      unit: options.unit,
      description: options.description
    };

    this.metrics.set(metric.id, metric);
    
    // Keep only recent metrics to prevent memory leak
    if (this.metrics.size > 10000) {
      const oldest_entries = Array.from(this.metrics.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, 1000);
      
      oldest_entries.forEach(([id]) => this.metrics.delete(id));
    }

    return metric.id;
  }

  async getMetrics(filter: {
    name?: string;
    type?: MonitoringMetric['type'];
    labels?: Record<string, string>;
    since?: Date;
    limit?: number;
  } = {}): Promise<MonitoringMetric[]> {
    let metrics = Array.from(this.metrics.values());

    if (filter.name) {
      metrics = metrics.filter(m => m.name.includes(filter.name!));
    }
    if (filter.type) {
      metrics = metrics.filter(m => m.type === filter.type);
    }
    if (filter.labels) {
      metrics = metrics.filter(m => 
        Object.entries(filter.labels!).every(([key, value]) => m.labels[key] === value)
      );
    }
    if (filter.since) {
      metrics = metrics.filter(m => m.timestamp >= filter.since!);
    }

    metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return metrics.slice(0, filter.limit || 1000);
  }

  async createAlert(
    name: string,
    condition: string,
    threshold: number,
    severity: MonitoringAlert['severity'],
    targets: string[] = []
  ): Promise<string> {
    const alert: MonitoringAlert = {`,
            id: alert_$
        }, { Date, now };
        ();
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], MonitoringService);
`_${Math.random().toString(36).substr(2, 9)}`,
    name,
    condition,
    threshold,
    status;
'active',
    severity,
    message;
Alert;
condition: $;
{
    condition;
}
threshold: $;
{
    threshold;
}
targets;
;
this.alerts.set(alert.id, alert);
`
    this.logger.log(`;
Alert;
created: $;
{
    name;
}
($);
{
    alert.id;
}
`, 'MonitoringService');
    
    return alert.id;
  }

  async getAlerts(status?: MonitoringAlert['status']): Promise<MonitoringAlert[]> {
    let alerts = Array.from(this.alerts.values());
    
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }

    return alerts.sort((a, b) => {
      const severity_order = { critical: 4, high: 3, medium: 2, low: 1 };
      return severity_order[b.severity] - severity_order[a.severity];
    });
  }

  async resolveAlert(id: string): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolved_at = new Date();
    this.logger.log(Alert resolved: ${alert.name} (${id}), 'MonitoringService');
    
    return true;
  }

  async suppressAlert(id: string): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert) {
      return false;
    }

    alert.status = 'suppressed';`;
this.logger.log(Alert, suppressed, $, { alert, : .name }($, { id } `)`, 'MonitoringService'));
return true;
async;
registerHealthCheck(name, string, check, () => Promise);
Promise < void  > {
    this: .health_checks.set(name, check),
    this: .logger.log(Health, check, registered, $, { name }, 'MonitoringService')
};
async;
getSystemHealth();
Promise < SystemHealth > {
    const: components, SystemHealth, ['components']:  = {},
    let, total_score = 0,
    let, component_count = 0,
    : .health_checks.entries()
};
{
    const start_time = Date.now();
    try {
        const is_healthy = await check();
        const response_time = Date.now() - start_time;
        components[name] = {
            status: is_healthy ? 'up' : 'down',
            response_time,
            last_check: new Date()
        };
        total_score += is_healthy ? 100 : 0;
        component_count++;
    }
    catch (error) {
        components[name] = {
            status: 'down',
            response_time: Date.now() - start_time,
            last_check: new Date(),
            message: error instanceof Error ? error.message : String(error)
        };
        component_count++;
    }
}
const overall_score = component_count > 0 ? total_score / component_count : 100;
const status = overall_score >= 90 ? 'healthy' : overall_score >= 70 ? 'warning' : 'critical';
return {
    status,
    components,
    overall_score,
    last_updated: new Date()
};
async;
createDashboard(name, string, widgets, Omit < MonitoringWidget, 'id' > [], []);
Promise < string > {
    const: dashboard, MonitoringDashboard = {} `
      id: dashboard_${Date.now()}`, _$
};
{
    Math.random().toString(36).substr(2, 9);
}
`,
      name,
      widgets: widgets.map(widget => ({
        ...widget,
        id: widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}
      })),
      created_at: new Date(),
      updated_at: new Date()
    };

    this.dashboards.set(dashboard.id, dashboard);`;
this.logger.log(Dashboard, created, $, { name } ` (${dashboard.id}), 'MonitoringService');
    
    return dashboard.id;
  }

  async getDashboards(): Promise<MonitoringDashboard[]> {
    return Array.from(this.dashboards.values());
  }

  async getDashboard(id: string): Promise<MonitoringDashboard | null> {
    return this.dashboards.get(id) || null;
  }

  private initializeDefaultAlerts(): void {
    // Create some default alerts
    this.createAlert('High Error Rate', 'error_rate > threshold', 0.05, 'high');
    this.createAlert('High Memory Usage', 'memory_usage > threshold', 0.9, 'medium');
    this.createAlert('High CPU Usage', 'cpu_usage > threshold', 0.8, 'medium');
    this.createAlert('Service Down', 'service_availability < threshold', 1.0, 'critical');
  }

  private startMonitoring(): void {
    this.monitoring_interval = setInterval(() => {
      this.checkAlerts();
      this.collectSystemMetrics();
    }, 10000); // Check every 10 seconds
  }

  private async checkAlerts(): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (alert.status !== 'active') {
        continue;
      }

      // Simplified alert checking - in real implementation would evaluate conditions
      const should_trigger = Math.random() < 0.01; // 1% chance to trigger for demo
      `);
if (should_trigger && !alert.triggered_at) {
    `
        alert.triggered_at = new Date();
        this.logger.warn(Alert triggered: ${alert.name}`, 'MonitoringService';
    ;
}
async;
collectSystemMetrics();
Promise < void  > {
    try: {
        // Collect basic system metrics
        const: memory_usage = process.memoryUsage(),
        await, this: .recordMetric('memory_used', memory_usage.heapUsed, 'gauge', { type: 'heap' }, { unit: 'bytes' }),
        await, this: .recordMetric('memory_total', memory_usage.heapTotal, 'gauge', { type: 'heap' }, { unit: 'bytes' }),
        await, this: .recordMetric('uptime', process.uptime(), 'gauge', {}, { unit: 'seconds' })
    }, catch(error) {
        this.logger.error('Failed to collect system metrics', error instanceof Error ? error : new Error(String(error)), 'MonitoringService');
    }
};
async;
destroy();
Promise < void  > {
    : .monitoring_interval
};
{
    clearInterval(this.monitoring_interval);
}
this.logger.log('MonitoringService destroyed', 'MonitoringService');
exports.default = MonitoringService;
//# sourceMappingURL=MonitoringService.js.map