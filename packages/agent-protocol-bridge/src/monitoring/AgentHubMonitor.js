"use strict";
/**
 * AgentHubMonitor
 * Comprehensive monitoring service for AgentHub and TRAYCER functionality
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentHubMonitor_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHubMonitor = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const perf_hooks_1 = require("perf_hooks");
const os = __importStar(require("os"));
const process = __importStar(require("process"));
/**
 * Comprehensive monitoring service for the AgentHub and TRAYCER functionality
 *
 * Features:
 * - Performance metrics tracking (response times, throughput, success rates)
 * - Health monitoring for agents, connections, and services
 * - Usage analytics and pattern tracking
 * - Error tracking and analysis
 * - Resource monitoring (CPU, memory, network, disk)
 * - Real-time dashboards and alerting
 * - Historical data analysis and trending
 * - Integration monitoring between services
 * - Export capabilities for external analysis
 * - Automatic alerting on performance degradation
 */
let AgentHubMonitor = AgentHubMonitor_1 = class AgentHubMonitor {
    eventEmitter;
    logger = new common_1.Logger(AgentHubMonitor_1.name);
    // Metrics storage
    performanceMetrics = {
        taskExecutionTimes: [],
        successRate: 100,
        errorRate: 0,
        averageResponseTime: 0,
        throughput: 0,
        concurrentTasks: 0,
    };
    healthMetrics = {
        agents: { total: 0, online: 0, offline: 0, busy: 0, error: 0 },
        connections: { relay: false, database: false, cache: false, external: false },
        services: { agentHub: 'healthy', relay: 'healthy', mcp: 'healthy', a2a: 'healthy' },
    };
    usageMetrics = {
        totalRequests: 0,
        planExecutions: 0,
        verificationRuns: 0,
        structuredPrompts: 0,
        workflowOrchestrations: 0,
        agentDiscoveries: 0,
        exportOperations: 0,
        popularAgents: new Map(),
        taskTypes: new Map(),
        userSessions: 0,
    };
    errorMetrics = {
        totalErrors: 0,
        errorsByType: new Map(),
        errorsByAgent: new Map(),
        criticalErrors: 0,
        recentErrors: [],
    };
    resourceMetrics = {
        cpu: { usage: 0, loadAverage: [] },
        memory: { used: 0, available: 0, heapUsed: 0, heapTotal: 0 },
        network: { connectionsIn: 0, connectionsOut: 0, bandwidth: 0 },
        disk: { usage: 0, available: 0 },
    };
    // Monitoring state
    activeTaskTimers = new Map();
    alertCooldowns = new Map();
    historicalData = [];
    maxHistorySize = 1000;
    monitoringEnabled = true;
    // Alert definitions
    alertDefinitions = [
        {
            id: 'high_error_rate',
            name: 'High Error Rate',
            condition: (metrics) => metrics.performance.errorRate > 10,
            severity: 'high',
            message: 'Error rate exceeded 10%',
            cooldown: 15,
        },
        {
            id: 'slow_response_time',
            name: 'Slow Response Time',
            condition: (metrics) => metrics.performance.averageResponseTime > 5000,
            severity: 'medium',
            message: 'Average response time exceeded 5 seconds',
            cooldown: 10,
        },
        {
            id: 'agent_offline',
            name: 'Agents Offline',
            condition: (metrics) => metrics.health.agents.offline > metrics.health.agents.total * 0.5,
            severity: 'high',
            message: 'More than 50% of agents are offline',
            cooldown: 5,
        },
        {
            id: 'high_cpu_usage',
            name: 'High CPU Usage',
            condition: (metrics) => metrics.resources.cpu.usage > 80,
            severity: 'medium',
            message: 'CPU usage exceeded 80%',
            cooldown: 10,
        },
        {
            id: 'low_memory',
            name: 'Low Memory',
            condition: (metrics) => metrics.resources.memory.available < 1024 * 1024 * 1024, // 1GB
            severity: 'high',
            message: 'Available memory below 1GB',
            cooldown: 5,
        },
        {
            id: 'service_unhealthy',
            name: 'Service Unhealthy',
            condition: (metrics) => Object.values(metrics.health.services).includes('unhealthy'),
            severity: 'critical',
            message: 'One or more critical services are unhealthy',
            cooldown: 5,
        },
    ];
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        this.logger.log('Initializing AgentHubMonitor');
        this.setupEventListeners();
        this.startMonitoring();
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down AgentHubMonitor');
        this.stopMonitoring();
    }
    /**
     * Setup event listeners for monitoring various events
     */
    setupEventListeners() {
        // Task execution events
        this.eventEmitter.on('task.started', (data) => {
            this.onTaskStarted(data.taskId, data.agentId);
        });
        this.eventEmitter.on('task.completed', (data) => {
            this.onTaskCompleted(data.taskId, data.agentId, data.duration);
        });
        this.eventEmitter.on('task.failed', (data) => {
            this.onTaskFailed(data.taskId, data.agentId, data.error);
        });
        // Agent events
        this.eventEmitter.on('agent.registered', (data) => {
            this.onAgentRegistered(data.agentId);
        });
        this.eventEmitter.on('agent.status_updated', (data) => {
            this.onAgentStatusUpdated(data.agentId, data.status);
        });
        // Service events
        this.eventEmitter.on('service.health_check', (data) => {
            this.onServiceHealthCheck(data.service, data.status);
        });
        // Connection events
        this.eventEmitter.on('relay.connected', () => {
            this.healthMetrics.connections.relay = true;
        });
        this.eventEmitter.on('relay.disconnected', () => {
            this.healthMetrics.connections.relay = false;
        });
        // API usage events
        this.eventEmitter.on('api.request', (data) => {
            this.onApiRequest(data.endpoint, data.agentId);
        });
        // Error events
        this.eventEmitter.on('error.*', (data) => {
            this.onError(data.type, data.message, data.agentId, data.context);
        });
    }
    /**
     * Start monitoring processes
     */
    startMonitoring() {
        this.monitoringEnabled = true;
        this.logger.log('AgentHub monitoring started');
    }
    /**
     * Stop monitoring processes
     */
    stopMonitoring() {
        this.monitoringEnabled = false;
        this.logger.log('AgentHub monitoring stopped');
    }
    /**
     * Task monitoring methods
     */
    onTaskStarted(taskId, agentId) {
        if (!this.monitoringEnabled)
            return;
        this.activeTaskTimers.set(taskId, perf_hooks_1.performance.now());
        this.performanceMetrics.concurrentTasks++;
        this.usageMetrics.totalRequests++;
        // Track popular agents
        const currentCount = this.usageMetrics.popularAgents.get(agentId) || 0;
        this.usageMetrics.popularAgents.set(agentId, currentCount + 1);
    }
    onTaskCompleted(taskId, agentId, duration) {
        if (!this.monitoringEnabled)
            return;
        const startTime = this.activeTaskTimers.get(taskId);
        if (startTime) {
            const executionTime = duration || (perf_hooks_1.performance.now() - startTime);
            this.performanceMetrics.taskExecutionTimes.push(executionTime);
            this.activeTaskTimers.delete(taskId);
            // Keep only last 1000 execution times
            if (this.performanceMetrics.taskExecutionTimes.length > 1000) {
                this.performanceMetrics.taskExecutionTimes.shift();
            }
            this.updatePerformanceMetrics();
        }
        this.performanceMetrics.concurrentTasks--;
    }
    onTaskFailed(taskId, agentId, error) {
        if (!this.monitoringEnabled)
            return;
        this.onTaskCompleted(taskId, agentId);
        this.onError('task_execution', error.message || 'Task execution failed', agentId, { taskId });
    }
    /**
     * Agent monitoring methods
     */
    onAgentRegistered(agentId) {
        if (!this.monitoringEnabled)
            return;
        this.healthMetrics.agents.total++;
        this.healthMetrics.agents.online++;
    }
    onAgentStatusUpdated(agentId, status) {
        if (!this.monitoringEnabled)
            return;
        // Update agent status counts (simplified logic)
        this.updateAgentStatusCounts();
    }
    /**
     * Service monitoring methods
     */
    onServiceHealthCheck(service, status) {
        if (!this.monitoringEnabled)
            return;
        if (service in this.healthMetrics.services) {
            this.healthMetrics.services[service] = status;
        }
    }
    /**
     * API usage monitoring
     */
    onApiRequest(endpoint, agentId) {
        if (!this.monitoringEnabled)
            return;
        this.usageMetrics.totalRequests++;
        // Track specific endpoint types
        if (endpoint.includes('execute-plan')) {
            this.usageMetrics.planExecutions++;
        }
        else if (endpoint.includes('verification')) {
            this.usageMetrics.verificationRuns++;
        }
        else if (endpoint.includes('structured-prompt')) {
            this.usageMetrics.structuredPrompts++;
        }
        else if (endpoint.includes('orchestrate')) {
            this.usageMetrics.workflowOrchestrations++;
        }
        else if (endpoint.includes('discover')) {
            this.usageMetrics.agentDiscoveries++;
        }
        else if (endpoint.includes('export')) {
            this.usageMetrics.exportOperations++;
        }
    }
    /**
     * Error monitoring
     */
    onError(type, message, agentId, context) {
        if (!this.monitoringEnabled)
            return;
        this.errorMetrics.totalErrors++;
        // Track by type
        const typeCount = this.errorMetrics.errorsByType.get(type) || 0;
        this.errorMetrics.errorsByType.set(type, typeCount + 1);
        // Track by agent
        if (agentId) {
            const agentCount = this.errorMetrics.errorsByAgent.get(agentId) || 0;
            this.errorMetrics.errorsByAgent.set(agentId, agentCount + 1);
        }
        // Track critical errors
        if (type.includes('critical') || message.toLowerCase().includes('critical')) {
            this.errorMetrics.criticalErrors++;
        }
        // Add to recent errors
        this.errorMetrics.recentErrors.push({
            timestamp: new Date().toISOString(),
            type,
            message,
            agentId,
            context,
        });
        // Keep only last 100 recent errors
        if (this.errorMetrics.recentErrors.length > 100) {
            this.errorMetrics.recentErrors.shift();
        }
        this.updatePerformanceMetrics();
    }
    /**
     * Update performance metrics calculations
     */
    updatePerformanceMetrics() {
        const times = this.performanceMetrics.taskExecutionTimes;
        if (times.length > 0) {
            this.performanceMetrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
        }
        const totalOperations = this.usageMetrics.totalRequests;
        if (totalOperations > 0) {
            this.performanceMetrics.errorRate = (this.errorMetrics.totalErrors / totalOperations) * 100;
            this.performanceMetrics.successRate = 100 - this.performanceMetrics.errorRate;
        }
        // Calculate throughput (operations per minute)
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        // This is simplified - in a real implementation, you'd track timestamped operations
        this.performanceMetrics.throughput = this.usageMetrics.totalRequests; // Simplified
    }
    /**
     * Update agent status counts
     */
    updateAgentStatusCounts() {
        // This is simplified - in a real implementation, you'd query actual agent statuses
        // For now, we'll maintain the existing counts
    }
    /**
     * Collect resource metrics
     */
    collectResourceMetrics() {
        if (!this.monitoringEnabled)
            return;
        try {
            // CPU metrics
            this.resourceMetrics.cpu.loadAverage = os.loadavg();
            this.resourceMetrics.cpu.usage = (1 - os.freemem() / os.totalmem()) * 100;
            // Memory metrics
            const memUsage = process.memoryUsage();
            this.resourceMetrics.memory.heapUsed = memUsage.heapUsed;
            this.resourceMetrics.memory.heapTotal = memUsage.heapTotal;
            this.resourceMetrics.memory.used = os.totalmem() - os.freemem();
            this.resourceMetrics.memory.available = os.freemem();
            // Network metrics (simplified)
            this.resourceMetrics.network.connectionsIn = 0; // Would need actual network monitoring
            this.resourceMetrics.network.connectionsOut = 0;
            this.resourceMetrics.network.bandwidth = 0;
            // Disk metrics (simplified)
            this.resourceMetrics.disk.usage = 0; // Would need actual disk monitoring
            this.resourceMetrics.disk.available = 0;
        }
        catch (error) {
            this.logger.error('Failed to collect resource metrics', error);
        }
    }
    /**
     * Check alerts and notifications
     */
    checkAlerts() {
        if (!this.monitoringEnabled)
            return;
        const now = Date.now();
        const currentMetrics = this.getCurrentDashboardData();
        for (const alert of this.alertDefinitions) {
            // Check cooldown
            const lastAlert = this.alertCooldowns.get(alert.id);
            if (lastAlert && (now - lastAlert) < (alert.cooldown * 60 * 1000)) {
                continue;
            }
            // Check condition
            if (alert.condition(currentMetrics)) {
                this.triggerAlert(alert);
                this.alertCooldowns.set(alert.id, now);
            }
        }
    }
    /**
     * Trigger an alert
     */
    triggerAlert(alert) {
        this.logger.warn(`Alert triggered: ${alert.name} - ${alert.message});
    
    this.eventEmitter.emit('alert.triggered', {
      id: alert.id,
      name: alert.name,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Store historical data
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  private storeHistoricalData(): void {
    if (!this.monitoringEnabled) return;
    
    const dashboardData = this.getCurrentDashboardData();
    this.historicalData.push(dashboardData);
    
    // Keep only recent history
    if (this.historicalData.length > this.maxHistorySize) {
      this.historicalData.shift();
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get current health metrics
   */
  public getHealthMetrics(): HealthMetrics {
    return { ...this.healthMetrics };
  }

  /**
   * Get current usage analytics
   */
  public getUsageAnalytics(): UsageMetrics {
    return {
      ...this.usageMetrics,
      popularAgents: new Map(this.usageMetrics.popularAgents),
      taskTypes: new Map(this.usageMetrics.taskTypes),
    };
  }

  /**
   * Get error tracking data
   */
  public getErrorTracking(): ErrorMetrics {
    return {
      ...this.errorMetrics,
      errorsByType: new Map(this.errorMetrics.errorsByType),
      errorsByAgent: new Map(this.errorMetrics.errorsByAgent),
      recentErrors: [...this.errorMetrics.recentErrors],
    };
  }

  /**
   * Get resource monitoring data
   */
  public getResourceMonitoring(): ResourceMetrics {
    return { ...this.resourceMetrics };
  }

  /**
   * Get real-time dashboard data
   */
  public getCurrentDashboardData(): DashboardData {
    return {
      timestamp: new Date().toISOString(),
      performance: this.getPerformanceMetrics(),
      health: this.getHealthMetrics(),
      usage: this.getUsageAnalytics(),
      errors: this.getErrorTracking(),
      resources: this.getResourceMonitoring(),
      alerts: [], // Would be populated with active alerts
    };
  }

  /**
   * Get historical analysis data
   */
  public getHistoricalData(hours: number = 24): DashboardData[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.historicalData.filter(data => 
      new Date(data.timestamp).getTime() > cutoff
    );
  }

  /**
   * Export monitoring data for external analysis
   */
  public exportMonitoringData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      exportTimestamp: new Date().toISOString(),
      current: this.getCurrentDashboardData(),
      historical: this.historicalData,
      alertDefinitions: this.alertDefinitions,
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Simplified CSV export - in a real implementation, you'd format this properly
      return 'timestamp,errorRate,responseTime,throughput\n' +
        this.historicalData.map(d => `, $, { d, : .timestamp } `,${d.performance.errorRate}`, $, { d, : .performance.averageResponseTime }, $, { d, : .performance.throughput }).join('\n');
    }
};
exports.AgentHubMonitor = AgentHubMonitor;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentHubMonitor.prototype, "collectResourceMetrics", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentHubMonitor.prototype, "checkAlerts", null);
exports.AgentHubMonitor = AgentHubMonitor = AgentHubMonitor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], AgentHubMonitor);
return JSON.stringify(data);
resetMetrics();
void {
    this: .performanceMetrics = {
        taskExecutionTimes: [],
        successRate: 100,
        errorRate: 0,
        averageResponseTime: 0,
        throughput: 0,
        concurrentTasks: 0,
    },
    this: .usageMetrics = {
        totalRequests: 0,
        planExecutions: 0,
        verificationRuns: 0,
        structuredPrompts: 0,
        workflowOrchestrations: 0,
        agentDiscoveries: 0,
        exportOperations: 0,
        popularAgents: new Map(),
        taskTypes: new Map(),
        userSessions: 0,
    },
    this: .errorMetrics = {
        totalErrors: 0,
        errorsByType: new Map(),
        errorsByAgent: new Map(),
        criticalErrors: 0,
        recentErrors: [],
    },
    this: .logger.log('All metrics have been reset')
};
setMonitoringEnabled(enabled, boolean);
void {
    this: .monitoringEnabled = enabled
} `
    this.logger.log(Monitoring ${enabled ? 'enabled' : 'disabled'}` `);
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): {
    enabled: boolean;
    activeTimers: number;
    historySize: number;
    alertDefinitions: number;
  } {
    return {
      enabled: this.monitoringEnabled,
      activeTimers: this.activeTaskTimers.size,
      historySize: this.historicalData.length,
      alertDefinitions: this.alertDefinitions.length,
    };
  }
};
//# sourceMappingURL=AgentHubMonitor.js.map