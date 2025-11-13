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
exports.IntegrationManagerService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const system_integrator_1 = require("./system-integrator");
let IntegrationManagerService = class IntegrationManagerService {
    logger;
    systemIntegrator;
    managed_integrations = new Map();
    scheduled_tasks = new Map();
    alerts = new Map();
    health_check_intervals = new Map();
    stats;
    constructor(logger, systemIntegrator) {
        this.logger = logger;
        this.systemIntegrator = systemIntegrator;
        this.initializeStats();
        this.startBackgroundTasks();
        this.logger.log('IntegrationManagerService initialized', 'IntegrationManagerService');
    }
    /**
     * Initialize manager statistics
     */
    initializeStats() {
        this.stats = {
            total_integrations: 0,
            active_integrations: 0,
            healthy_integrations: 0,
            warning_integrations: 0,
            critical_integrations: 0,
            total_alerts: 0,
            unresolved_alerts: 0,
            average_health_score: 0,
            average_uptime: 0,
            integrations_by_category: {
                data_source: 0,
                data_destination: 0,
                communication: 0,
                authentication: 0,
                monitoring: 0,
                storage: 0,
                analytics: 0,
                workflow: 0,
                external_api: 0,
                internal_service: 0
            },
            scheduled_tasks_total: 0,
            scheduled_tasks_running: 0
        };
    }
    /**
     * Register a managed integration
     */
    async registerManagedIntegration(integration_id, config) {
        try {
            // Verify integration exists in system integrator
            const integration = this.systemIntegrator.getIntegration(integration_id);
            if (!integration) {
                throw new Error(`Integration not found: ${integration_id});
      }
`);
                const managed_id = `managed_${Date.now()}`, _$, { Math, random };
                ().toString(36).substr(2, 9);
            }
            ;
            const default_config = {
                auto_restart: true,
                health_check_interval: 60000, // 1 minute
                alert_thresholds: {
                    response_time_warning: 1000,
                    response_time_critical: 5000,
                    error_rate_warning: 0.05,
                    error_rate_critical: 0.15,
                    availability_warning: 0.95,
                    availability_critical: 0.9
                },
                backup_strategy: {
                    enabled: true,
                    frequency: 'daily',
                    retention_days: 30,
                    backup_location: '/backups'
                },
                scaling_policy: {
                    enabled: false,
                    min_instances: 1,
                    max_instances: 3,
                    scale_up_threshold: 0.8,
                    scale_down_threshold: 0.3,
                    cooldown_period: 300000 // 5 minutes
                },
                maintenance_window: {
                    enabled: true,
                    day_of_week: 0, // Sunday
                    start_hour: 2,
                    duration_hours: 2,
                    timezone: 'UTC'
                },
                monitoring_config: {
                    metrics_collection_interval: 30000, // 30 seconds
                    log_level: 'info',
                    custom_metrics: [],
                    dashboard_enabled: true
                }
            };
            const managed_integration = {
                id: managed_id,
                integration_id,
                name: config.name,
                description: config.description,
                category: config.category,
                status: 'monitoring',
                health_score: 100,
                performance_metrics: {
                    availability: 100,
                    response_time_avg: 0,
                    response_time_p95: 0,
                    response_time_p99: 0,
                    throughput: 0,
                    error_rate: 0,
                    success_rate: 100,
                    uptime_percentage: 100,
                    last_24h_requests: 0,
                    last_24h_errors: 0
                },
                configuration: { ...default_config, ...config.configuration },
                dependencies: [],
                scheduled_tasks: [],
                alerts: [],
                last_health_check: new Date(0),
                next_health_check: new Date(Date.now() + default_config.health_check_interval),
                created_at: new Date(),
                updated_at: new Date()
            };
            this.managed_integrations.set(managed_id, managed_integration);
            // Set up health checking
            await this.setupHealthChecking(managed_integration);
            // Create default scheduled tasks
            await this.createDefaultScheduledTasks(managed_integration);
            this.updateStats();
            `
      this.logger.log(`;
            Managed;
            integration;
            registered: $;
            {
                config.name;
            }
            ` (${managed_id}), 'IntegrationManagerService');
      return managed_id;

    } catch (error) {
      this.logger.error('Failed to register managed integration', error instanceof Error ? error : new Error(String(error)), 'IntegrationManagerService');
      throw error;
    }
  }

  /**
   * Setup health checking for integration
   */
  private async setupHealthChecking(integration: ManagedIntegration): Promise<void> {
    const interval = setInterval(async () => {
      await this.performHealthCheck(integration.id);
    }, integration.configuration.health_check_interval);

    this.health_check_intervals.set(integration.id, interval);

    // Perform initial health check
    await this.performHealthCheck(integration.id);
  }

  /**
   * Perform health check for integration
   */
  async performHealthCheck(managed_id: string): Promise<boolean> {
    const managed_integration = this.managed_integrations.get(managed_id);
    if (!managed_integration) {
      return false;
    }

    try {
      const integration_metrics = this.systemIntegrator.getIntegrationMetrics(managed_integration.integration_id);
      if (!integration_metrics) {
        throw new Error('Integration metrics not available');
      }

      // Update performance metrics
      managed_integration.performance_metrics = {
        availability: integration_metrics.integration_health === 'healthy' ? 100 : 
                     integration_metrics.integration_health === 'degraded' ? 80 : 20,
        response_time_avg: integration_metrics.average_response_time,
        response_time_p95: integration_metrics.average_response_time * 1.5,
        response_time_p99: integration_metrics.average_response_time * 2,
        throughput: integration_metrics.total_requests,
        error_rate: integration_metrics.error_rate,
        success_rate: 1 - integration_metrics.error_rate,
        uptime_percentage: integration_metrics.integration_health === 'healthy' ? 100 : 
                          integration_metrics.integration_health === 'degraded' ? 95 : 50,
        last_24h_requests: integration_metrics.total_requests,
        last_24h_errors: integration_metrics.failed_requests
      };

      // Calculate health score
      managed_integration.health_score = this.calculateHealthScore(managed_integration);

      // Update status based on health
      const previous_status = managed_integration.status;
      managed_integration.status = this.determineStatus(managed_integration);

      // Check for alert conditions
      await this.checkAlertConditions(managed_integration);

      // Update timestamps
      managed_integration.last_health_check = new Date();
      managed_integration.next_health_check = new Date(
        Date.now() + managed_integration.configuration.health_check_interval
      );
      managed_integration.updated_at = new Date();

      if (previous_status !== managed_integration.status) {
        this.logger.log(`;
            Integration;
            status;
            changed: $;
            {
                managed_integration.name;
            }
            ` ${previous_status} -> ${managed_integration.status}`,
                'IntegrationManagerService';
            ;
        }
        finally {
        }
        return true;
    }
    catch(error) {
        this.logger.error(Health, check, failed);
        for ($; { managed_integration, : .name }, error instanceof Error ? error : new Error(String(error)), 'IntegrationManagerService';)
            ;
        // Create critical alert
        await this.createAlert(managed_integration, {
            severity: 'critical',
            type: 'availability_down',
        } `
        title: 'Health Check Failed',`, message, `Health check failed: ${error instanceof Error ? error.message : String(error)}
      });

      return false;
    }
  }

  /**
   * Calculate health score based on metrics
   */
  private calculateHealthScore(integration: ManagedIntegration): number {
    const metrics = integration.performance_metrics;
    const thresholds = integration.configuration.alert_thresholds;

    let score = 100;

    // Availability impact (40% weight)
    if (metrics.availability < thresholds.availability_critical) {
      score -= 40;
    } else if (metrics.availability < thresholds.availability_warning) {
      score -= 20;
    }

    // Response time impact (30% weight)
    if (metrics.response_time_avg > thresholds.response_time_critical) {
      score -= 30;
    } else if (metrics.response_time_avg > thresholds.response_time_warning) {
      score -= 15;
    }

    // Error rate impact (30% weight)
    if (metrics.error_rate > thresholds.error_rate_critical) {
      score -= 30;
    } else if (metrics.error_rate > thresholds.error_rate_warning) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Determine integration status based on health metrics
   */
  private determineStatus(integration: ManagedIntegration): ManagedIntegrationStatus {
    const health_score = integration.health_score;
    const metrics = integration.performance_metrics;
    const thresholds = integration.configuration.alert_thresholds;

    if (metrics.availability < thresholds.availability_critical || 
        metrics.error_rate > thresholds.error_rate_critical) {
      return 'error';
    }

    if (health_score < 70) {
      return 'warning';
    }

    if (health_score < 90) {
      return 'monitoring';
    }

    return 'active';
  }

  /**
   * Check for alert conditions
   */
  private async checkAlertConditions(integration: ManagedIntegration): Promise<void> {
    const metrics = integration.performance_metrics;
    const thresholds = integration.configuration.alert_thresholds;

    // Response time alerts
    if (metrics.response_time_avg > thresholds.response_time_critical) {
      await this.createAlert(integration, {
        severity: 'critical',
        type: 'high_response_time',
        title: 'Critical Response Time',`, message, Response, time, $, { metrics, : .response_time_avg } `ms exceeds critical threshold ${thresholds.response_time_critical}`, ms);
    }
    ;
};
exports.IntegrationManagerService = IntegrationManagerService;
exports.IntegrationManagerService = IntegrationManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        system_integrator_1.SystemIntegratorService])
], IntegrationManagerService);
if (metrics.response_time_avg > thresholds.response_time_warning) {
    await this.createAlert(integration, {
        severity: 'warning',
        type: 'high_response_time',
        title: 'High Response Time',
        message: Response, time, $
    }, { metrics, : .response_time_avg }, ms, exceeds, warning, threshold, $, { thresholds, : .response_time_warning }, ms);
}
;
// Error rate alerts
if (metrics.error_rate > thresholds.error_rate_critical) {
    await this.createAlert(integration, {
        severity: 'critical',
        type: 'high_error_rate',
        title: 'Critical Error Rate',
    } `
        message: Error rate ${(metrics.error_rate * 100).toFixed(2)}` % exceeds, critical, threshold, $, {}(thresholds.error_rate_critical * 100).toFixed(2));
}
 %
;
;
if (metrics.error_rate > thresholds.error_rate_warning) {
    await this.createAlert(integration, {} `
        severity: 'warning',`, type, 'high_error_rate', title, 'High Error Rate', message, Error, rate, $, {}(metrics.error_rate * 100).toFixed(2));
}
`% exceeds warning threshold ${(thresholds.error_rate_warning * 100).toFixed(2)}%
      });
    }

    // Availability alerts
    if (metrics.availability < thresholds.availability_critical) {
      await this.createAlert(integration, {
        severity: 'critical',`;
type: 'availability_down', `
        title: 'Critical Availability',
        message: Availability ${metrics.availability.toFixed(2)}` % below;
critical;
threshold;
$;
{
    (thresholds.availability_critical * 100).toFixed(2);
}
 %
;
;
if (metrics.availability < thresholds.availability_warning) {
    await this.createAlert(integration, {
        severity: 'warning',
    } `
        type: 'availability_down',`, title, 'Low Availability', message, Availability, $, { metrics, : .availability.toFixed(2) } `% below warning threshold ${(thresholds.availability_warning * 100).toFixed(2)}%
      });
    }
  }

  /**
   * Create alert for integration
   */
  private async createAlert(
    integration: ManagedIntegration,
    alert_data: {
      severity: AlertSeverity;
      type: AlertType;
      title: string;
      message: string;
      metadata?: Record<string, any>;`);
}
`
  ): Promise<string> {
    const alert_id = alert_${Date.now()}`;
_$;
{
    Math.random().toString(36).substr(2, 9);
}
;
const alert = {
    id: alert_id,
    integration_id: integration.id,
    severity: alert_data.severity,
    type: alert_data.type,
    title: alert_data.title,
    message: alert_data.message,
    triggered_at: new Date(),
    metadata: alert_data.metadata || {}
};
this.alerts.set(alert_id, alert);
integration.alerts.push(alert);
`
`;
this.logger.log(Alert, created, $, { alert_data, : .severity } ` - ${alert_data.title} for ${integration.name},
      'IntegrationManagerService'
    );

    return alert_id;
  }

  /**
   * Create default scheduled tasks for integration
   */
  private async createDefaultScheduledTasks(integration: ManagedIntegration): Promise<void> {
    const tasks: Omit<ScheduledTask, 'id'>[] = [
      {
        name: 'Health Check',
        type: 'health_check',
        schedule: '*/5 * * * *', // Every 5 minutes
        enabled: true,
        last_run: new Date(0),
        next_run: new Date(),
        status: 'pending',
        configuration: {}
      },
      {
        name: 'Daily Backup',
        type: 'backup',
        schedule: '0 2 * * *', // Daily at 2 AM
        enabled: integration.configuration.backup_strategy.enabled,
        last_run: new Date(0),
        next_run: new Date(),
        status: 'pending',
        configuration: integration.configuration.backup_strategy
      },
      {
        name: 'Weekly Cleanup',
        type: 'cleanup',
        schedule: '0 3 * * 0', // Sunday at 3 AM
        enabled: true,
        last_run: new Date(0),
        next_run: new Date(),
        status: 'pending',
        configuration: { max_age_days: 30 }
      }
    ];` `
    for (const task_data of tasks) {
      const task_id = task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
const task = { ...task_data, id: task_id };
this.scheduled_tasks.set(task_id, task);
integration.scheduled_tasks.push(task);
startBackgroundTasks();
void {
    // Task scheduler - runs every minute
    setInterval(async) { }
}();
{
    await this.processScheduledTasks();
}
60000;
;
// Stats update - runs every 30 seconds
setInterval(() => {
    this.updateStats();
}, 30000);
// Alert cleanup - runs every hour
setInterval(() => {
    this.cleanupOldAlerts();
}, 3600000);
async;
processScheduledTasks();
Promise < void  > {
    const: now = new Date(),
    : .scheduled_tasks.values()
};
{
    if (task.enabled && task.status === 'pending' && task.next_run <= now) {
        await this.executeScheduledTask(task);
    }
}
async;
executeScheduledTask(task, ScheduledTask);
Promise < void  > {
    try: {
        task, : .status = 'running',
        task, : .last_run = new Date(),
        this: .logger.log(Executing, scheduled, task, $, { task, : .name }, 'IntegrationManagerService'),
        switch(task) { }, : .type
    }
};
{
    'health_check';
    // Find integration for this task
    const integration = Array.from(this.managed_integrations.values())
        .find(int => int.scheduled_tasks.some(t => t.id === task.id));
    if (integration) {
        await this.performHealthCheck(integration.id);
    }
    break;
    'backup';
    await this.performBackup(task);
    break;
    'cleanup';
    await this.performCleanup(task);
    break;
    `
`;
    this.logger.warn(Unknown, task, type, $, { task, : .type } `, 'IntegrationManagerService');
      }

      task.status = 'completed';
      task.next_run = this.calculateNextRun(task.schedule);

    } catch (error) {
      task.status = 'failed';
      this.logger.error(Scheduled task failed: ${task.name}, error instanceof Error ? error : new Error(String(error)), 'IntegrationManagerService');
    }
  }

  /**
   * Calculate next run time based on cron schedule
   */
  private calculateNextRun(schedule: string): Date {
    // Simplified cron calculation - in production would use a proper cron library
    const now = new Date();
    return new Date(now.getTime() + 300000); // 5 minutes from now
  }

  /**
   * Perform backup task
   */
  private async performBackup(task: ScheduledTask): Promise<void> {
    this.logger.log('Performing backup task', 'IntegrationManagerService');
    // Simulate backup operation
  }

  /**
   * Perform cleanup task
   */
  private async performCleanup(task: ScheduledTask): Promise<void> {
    this.logger.log('Performing cleanup task', 'IntegrationManagerService');
    // Simulate cleanup operation
  }

  /**
   * Cleanup old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoff_time = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    let cleaned_count = 0;

    for (const [alert_id, alert] of this.alerts.entries()) {
      if (alert.resolved_at && alert.resolved_at.getTime() < cutoff_time) {
        this.alerts.delete(alert_id);
        cleaned_count++;
      }
    }` `
    if (cleaned_count > 0) {
      this.logger.log(Cleaned up ${cleaned_count} old alerts`, 'IntegrationManagerService');
}
updateStats();
void {
    const: integrations = Array.from(this.managed_integrations.values()),
    this: .stats.total_integrations = integrations.length,
    this: .stats.active_integrations = integrations.filter(int => int.status === 'active').length,
    this: .stats.healthy_integrations = integrations.filter(int => int.health_score >= 90).length,
    this: .stats.warning_integrations = integrations.filter(int => int.health_score >= 70 && int.health_score < 90).length,
    this: .stats.critical_integrations = integrations.filter(int => int.health_score < 70).length,
    this: .stats.total_alerts = this.alerts.size,
    this: .stats.unresolved_alerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved_at).length,
    if(integrations) { }, : .length > 0
};
{
    this.stats.average_health_score = integrations.reduce((sum, int) => sum + int.health_score, 0) / integrations.length;
    this.stats.average_uptime = integrations.reduce((sum, int) => sum + int.performance_metrics.uptime_percentage, 0) / integrations.length;
}
// Reset category counters
Object.keys(this.stats.integrations_by_category).forEach(key => {
    this.stats.integrations_by_category[key] = 0;
});
// Count by category
for (const integration of integrations) {
    this.stats.integrations_by_category[integration.category]++;
}
this.stats.scheduled_tasks_total = this.scheduled_tasks.size;
this.stats.scheduled_tasks_running = Array.from(this.scheduled_tasks.values())
    .filter(task => task.status === 'running').length;
/**
 * Get managed integration by ID
 */
getManagedIntegration(managed_id, string);
ManagedIntegration | null;
{
    return this.managed_integrations.get(managed_id) || null;
}
/**
 * Get all managed integrations
 */
getAllManagedIntegrations();
ManagedIntegration[];
{
    return Array.from(this.managed_integrations.values());
}
/**
 * Get alerts for integration
 */
getIntegrationAlerts(managed_id, string);
IntegrationAlert[];
{
    const integration = this.managed_integrations.get(managed_id);
    return integration ? integration.alerts : [];
}
/**
 * Get all unresolved alerts
 */
getUnresolvedAlerts();
IntegrationAlert[];
{
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved_at);
}
/**
 * Acknowledge alert
 */
async;
acknowledgeAlert(alert_id, string, acknowledged_by, string);
Promise < boolean > {
    const: alert = this.alerts.get(alert_id),
    if(, alert) { }
} || alert.acknowledged_at;
{
    return false;
}
alert.acknowledged_at = new Date();
alert.acknowledged_by = acknowledged_by;
this.logger.log(Alert, acknowledged, $, { alert_id }, by, $, { acknowledged_by } `, 'IntegrationManagerService');
    return true;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alert_id: string, resolution_notes?: string): Promise<boolean> {
    const alert = this.alerts.get(alert_id);
    if (!alert || alert.resolved_at) {
      return false;
    }

    alert.resolved_at = new Date();
    alert.resolution_notes = resolution_notes;

    this.logger.log(Alert resolved: ${alert_id}, 'IntegrationManagerService');
    return true;
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfiguration(
    managed_id: string, 
    config_updates: Partial<IntegrationConfiguration>
  ): Promise<boolean> {
    const integration = this.managed_integrations.get(managed_id);
    if (!integration) {
      return false;
    }

    integration.configuration = { ...integration.configuration, ...config_updates };
    integration.updated_at = new Date();

    // Restart health checking if interval changed
    if (config_updates.health_check_interval) {
      const existing_interval = this.health_check_intervals.get(managed_id);
      if (existing_interval) {
        clearInterval(existing_interval);
      }
      await this.setupHealthChecking(integration);
    }
`, this.logger.log(Integration, configuration, updated, $, { integration, : .name } `, 'IntegrationManagerService');
    return true;
  }

  /**
   * Remove managed integration
   */
  async removeManagedIntegration(managed_id: string): Promise<boolean> {
    const integration = this.managed_integrations.get(managed_id);
    if (!integration) {
      return false;
    }

    // Stop health checking
    const health_interval = this.health_check_intervals.get(managed_id);
    if (health_interval) {
      clearInterval(health_interval);
      this.health_check_intervals.delete(managed_id);
    }

    // Remove scheduled tasks
    for (const task of integration.scheduled_tasks) {
      this.scheduled_tasks.delete(task.id);
    }

    // Mark alerts as resolved
    for (const alert of integration.alerts) {
      if (!alert.resolved_at) {
        alert.resolved_at = new Date();
        alert.resolution_notes = 'Integration removed';
      }
    }

    this.managed_integrations.delete(managed_id);
    this.updateStats();

    this.logger.log(Managed integration removed: ${integration.name}` `, 'IntegrationManagerService');
    return true;
  }

  /**
   * Get manager statistics
   */
  getManagerStats(): IntegrationManagerStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const stats = this.getManagerStats();
    
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (stats.critical_integrations > 0 || stats.unresolved_alerts > 10) {
      status = 'unhealthy';
    } else if (stats.warning_integrations > stats.total_integrations * 0.2 || stats.unresolved_alerts > 5) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      details: {
        total_integrations: stats.total_integrations,
        healthy_integrations: stats.healthy_integrations,
        warning_integrations: stats.warning_integrations,
        critical_integrations: stats.critical_integrations,
        unresolved_alerts: stats.unresolved_alerts,
        average_health_score: stats.average_health_score,
        average_uptime: stats.average_uptime,
        scheduled_tasks_running: stats.scheduled_tasks_running
      }
    };
  }
}

export default IntegrationManagerService;
));
//# sourceMappingURL=IntegrationManager.js.map