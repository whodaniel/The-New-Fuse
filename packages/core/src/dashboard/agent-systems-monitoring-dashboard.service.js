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
var AgentSystemsMonitoringDashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSystemsMonitoringDashboardService = exports.HealthStatus = exports.SystemComponent = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const common_2 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const uuid_1 = require("uuid");
/**
 * System Component Types for Monitoring
 */
var SystemComponent;
(function (SystemComponent) {
    SystemComponent["AGENT_FEDERATION"] = "agent-federation";
    SystemComponent["TERMINAL_ORCHESTRATION"] = "terminal-orchestration";
    SystemComponent["VSCODE_BRIDGE"] = "vscode-bridge";
    SystemComponent["DACC_SYSTEM"] = "dacc-system";
    SystemComponent["MULTI_PROTOCOL"] = "multi-protocol";
    SystemComponent["TNF_CLI"] = "tnf-cli";
    SystemComponent["API_GATEWAY"] = "api-gateway";
    SystemComponent["DATABASE"] = "database";
    SystemComponent["AUTHENTICATION"] = "authentication";
    SystemComponent["FILE_SYSTEM"] = "file-system";
})(SystemComponent || (exports.SystemComponent = SystemComponent = {}));
/**
 * Health Status Levels
 */
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["WARNING"] = "warning";
    HealthStatus["CRITICAL"] = "critical";
    HealthStatus["OFFLINE"] = "offline";
    HealthStatus["UNKNOWN"] = "unknown";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * Comprehensive Monitoring Dashboard Service
 *
 * Provides real-time monitoring and visualization for all agent systems:
 * - Agent Federation system health and performance
 * - Terminal Orchestration metrics and coordination status
 * - VSCode Bridge communication analytics
 * - DACC system orchestration metrics
 * - Multi-Protocol coordination statistics
 * - TNF CLI usage patterns and performance
 * - Real-time alerts and notifications
 * - Performance trending and analytics
 */
let AgentSystemsMonitoringDashboardService = AgentSystemsMonitoringDashboardService_1 = class AgentSystemsMonitoringDashboardService {
    eventEmitter;
    logger = new common_2.Logger(AgentSystemsMonitoringDashboardService_1.name);
    server;
    componentHealth = new Map();
    agentMetrics = new Map();
    systemEvents = [];
    dashboardWidgets = new Map();
    metricsHistory = new Map();
    alertRules = new Map();
    activeAlerts = new Map();
    // Monitoring intervals
    healthCheckInterval;
    metricsCollectionInterval;
    alertProcessingInterval;
    // Configuration
    config = {
        healthCheckInterval: 5000, // 5 seconds
        metricsRetentionHours: 24, // 24 hours
        alertProcessingInterval: 1000, // 1 second
        maxEventsToRetain: 1000,
        criticalThresholds: {
            cpuUsage: 80,
            memoryUsage: 85,
            errorRate: 10,
            responseTime: 5000
        }
    };
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.initializeSystemComponents();
        this.setupDefaultAlertRules();
        this.startMonitoring();
        this.setupEventListeners();
    }
    /**
     * Initialize monitoring for all system components
     */
    initializeSystemComponents() {
        const components = Object.values(SystemComponent);
        components.forEach(component => {
            const health = {
                component,
                status: HealthStatus.UNKNOWN,
                lastCheck: Date.now(),
                uptime: 0,
                errorCount: 0,
                warningCount: 0,
                metrics: {},
                dependencies: this.getComponentDependencies(component),
                details: {
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    configuration: {},
                    endpoints: [],
                    activeConnections: 0,
                    resourceUsage: {
                        cpu: 0,
                        memory: 0,
                        disk: 0,
                        network: 0
                    }
                }
            };
            this.componentHealth.set(component, health);
        });
        this.logger.log('System components initialized for monitoring');
    }
    /**
     * Get component dependencies for dependency graph visualization
     */
    getComponentDependencies(component) {
        const dependencyMap = {
            [SystemComponent.AGENT_FEDERATION]: [
                SystemComponent.DATABASE,
                SystemComponent.API_GATEWAY,
                SystemComponent.MULTI_PROTOCOL
            ],
            [SystemComponent.TERMINAL_ORCHESTRATION]: [
                SystemComponent.AGENT_FEDERATION,
                SystemComponent.VSCODE_BRIDGE
            ],
            [SystemComponent.VSCODE_BRIDGE]: [
                SystemComponent.AGENT_FEDERATION,
                SystemComponent.MULTI_PROTOCOL
            ],
            [SystemComponent.DACC_SYSTEM]: [
                SystemComponent.AGENT_FEDERATION,
                SystemComponent.DATABASE,
                SystemComponent.AUTHENTICATION
            ],
            [SystemComponent.MULTI_PROTOCOL]: [
                SystemComponent.AGENT_FEDERATION
            ],
            [SystemComponent.TNF_CLI]: [
                SystemComponent.TERMINAL_ORCHESTRATION,
                SystemComponent.AGENT_FEDERATION
            ],
            [SystemComponent.API_GATEWAY]: [
                SystemComponent.DATABASE,
                SystemComponent.AUTHENTICATION,
                SystemComponent.AGENT_FEDERATION
            ],
            [SystemComponent.DATABASE]: [],
            [SystemComponent.AUTHENTICATION]: [
                SystemComponent.DATABASE
            ],
            [SystemComponent.FILE_SYSTEM]: []
        };
        return dependencyMap[component] || [];
    }
    /**
     * Setup default alert rules
     */
    setupDefaultAlertRules() {
        // CPU Usage Alert
        this.alertRules.set('high-cpu-usage', (health) => {
            const cpu = health.details.resourceUsage.cpu;
            if (cpu > this.config.criticalThresholds.cpuUsage) {
                return {
                    type: 'critical',
                    title: `High CPU Usage: ${health.component},`,
                    description: `CPU usage at ${cpu}` % , exceeding, $
                };
                {
                    this.config.criticalThresholds.cpuUsage;
                }
                 % threshold,
                    metadata;
                {
                    cpu, threshold;
                    this.config.criticalThresholds.cpuUsage;
                }
            }
            ;
        });
        return null;
    }
    ;
};
exports.AgentSystemsMonitoringDashboardService = AgentSystemsMonitoringDashboardService;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", ws_1.Server)
], AgentSystemsMonitoringDashboardService.prototype, "server", void 0);
exports.AgentSystemsMonitoringDashboardService = AgentSystemsMonitoringDashboardService = AgentSystemsMonitoringDashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    }),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], AgentSystemsMonitoringDashboardService);
// Memory Usage Alert
this.alertRules.set('high-memory-usage', (health) => {
    const memory = health.details.resourceUsage.memory;
    if (memory > this.config.criticalThresholds.memoryUsage) {
        return {
            type: 'critical',
        } `
          title: `;
        High;
        Memory;
        Usage: $;
        {
            health.component;
        }
        `,
          description: Memory usage at ${memory}%, exceeding ${this.config.criticalThresholds.memoryUsage}% threshold,
          metadata: { memory, threshold: this.config.criticalThresholds.memoryUsage }
        };
      }
      return null;
    });

    // Error Rate Alert
    this.alertRules.set('high-error-rate', (health: ComponentHealth) => {
      const errorRate = health.errorCount / Math.max(1, Date.now() - health.lastCheck) * 1000;
      if (errorRate > this.config.criticalThresholds.errorRate) {
        return {
          type: 'warning',`;
        title: High;
        Error;
        Rate: $;
        {
            health.component;
        }
        `,
          description: Error rate at ${errorRate.toFixed(2)}` / sec, exceeding;
        $;
        {
            this.config.criticalThresholds.errorRate;
        }
        /sec threshold,;
        metadata: {
            errorRate, threshold;
            this.config.criticalThresholds.errorRate;
        }
    }
    ;
});
return null;
;
// Component Offline Alert
this.alertRules.set('component-offline', (health) => {
    if (health.status === HealthStatus.OFFLINE) {
        return {
            type: 'critical',
        } `
          title: Component Offline: ${health.component},`;
        description: `System component is offline and not responding to health checks,
          metadata: { lastCheck: health.lastCheck, uptime: health.uptime }
        };
      }
      return null;
    });
  }

  /**
   * Start monitoring processes
   */
  private startMonitoring(): void {
    // Health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    // Metrics collection
    this.metricsCollectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.healthCheckInterval);

    // Alert processing
    this.alertProcessingInterval = setInterval(() => {
      this.processAlerts();
    }, this.config.alertProcessingInterval);

    this.logger.log('Monitoring processes started');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to system events
    this.eventEmitter.on('agent.**', (data) => {
      this.handleAgentEvent(data);
    });

    this.eventEmitter.on('system.**', (data) => {
      this.handleSystemEvent(data);
    });

    this.eventEmitter.on('protocol.**', (data) => {
      this.handleProtocolEvent(data);
    });

    this.eventEmitter.on('terminal.**', (data) => {
      this.handleTerminalEvent(data);
    });

    this.eventEmitter.on('vscode.**', (data) => {
      this.handleVSCodeEvent(data);
    });
  }

  /**
   * Perform health checks for all components
   */
  private async performHealthChecks(): Promise<void> {
    for (const [component, health] of this.componentHealth) {
      try {
        const newHealth = await this.checkComponentHealth(component);
        this.updateComponentHealth(component, newHealth);
      } catch (error) {
        this.logger.error(Health check failed for ${component}:, error);
        this.updateComponentHealth(component, { status: HealthStatus.CRITICAL });
      }
    }

    // Broadcast health update to connected clients
    this.broadcastToClients('health-update', {
      timestamp: Date.now(),
      components: Array.from(this.componentHealth.entries()).map(([comp, health]) => ({
        component: comp,
        status: health.status,
        uptime: health.uptime,
        errorCount: health.errorCount
      }))
    });
  }

  /**
   * Check individual component health
   */
  private async checkComponentHealth(component: SystemComponent): Promise<Partial<ComponentHealth>> {
    switch (component) {
      case SystemComponent.AGENT_FEDERATION:
        return await this.checkAgentFederationHealth();

      case SystemComponent.TERMINAL_ORCHESTRATION:
        return await this.checkTerminalOrchestrationHealth();

      case SystemComponent.VSCODE_BRIDGE:
        return await this.checkVSCodeBridgeHealth();

      case SystemComponent.DACC_SYSTEM:
        return await this.checkDACCSystemHealth();

      case SystemComponent.MULTI_PROTOCOL:
        return await this.checkMultiProtocolHealth();

      case SystemComponent.TNF_CLI:
        return await this.checkTNFCLIHealth();

      case SystemComponent.DATABASE:
        return await this.checkDatabaseHealth();

      case SystemComponent.API_GATEWAY:
        return await this.checkAPIGatewayHealth();

      default:
        return { status: HealthStatus.UNKNOWN };
    }
  }

  /**
   * Component-specific health checks
   */
  private async checkAgentFederationHealth(): Promise<Partial<ComponentHealth>> {
    // Mock implementation - would integrate with actual AgentFederation service
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { federationNodes: 3, activeAgents: 12 },
        endpoints: ['http://localhost:3000/federation', 'ws://localhost:3000/federation'],
        activeConnections: 15,
        resourceUsage: {
          cpu: Math.random() * 50 + 10,
          memory: Math.random() * 40 + 20,
          disk: Math.random() * 30 + 10,
          network: Math.random() * 20 + 5
        }
      }
    };
  }

  private async checkTerminalOrchestrationHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '1.5.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { activeTerminals: 8, orchestratedAgents: 5 },
        endpoints: ['terminal://orchestration'],
        activeConnections: 8,
        resourceUsage: {
          cpu: Math.random() * 30 + 5,
          memory: Math.random() * 25 + 10,
          disk: Math.random() * 15 + 5,
          network: Math.random() * 10 + 2
        }
      }
    };
  }

  private async checkVSCodeBridgeHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '1.2.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { connectedExtensions: 3, activeBridges: 2 },
        endpoints: ['ws://localhost:8080/vscode-bridge'],
        activeConnections: 3,
        resourceUsage: {
          cpu: Math.random() * 20 + 3,
          memory: Math.random() * 30 + 8,
          disk: Math.random() * 10 + 2,
          network: Math.random() * 15 + 3
        }
      }
    };
  }

  private async checkDACCSystemHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '1.8.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { orchestratedSessions: 6, activeConfigurations: 12 },
        endpoints: ['http://localhost:3000/dacc'],
        activeConnections: 6,
        resourceUsage: {
          cpu: Math.random() * 40 + 8,
          memory: Math.random() * 35 + 15,
          disk: Math.random() * 20 + 8,
          network: Math.random() * 12 + 4
        }
      }
    };
  }

  private async checkMultiProtocolHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { activeProtocols: 5, messagesThroughput: 1250 },
        endpoints: ['multi://protocol-coordinator'],
        activeConnections: 18,
        resourceUsage: {
          cpu: Math.random() * 25 + 6,
          memory: Math.random() * 20 + 12,
          disk: Math.random() * 8 + 3,
          network: Math.random() * 30 + 10
        }
      }
    };
  }

  private async checkTNFCLIHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '2.1.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { activeSessions: 4, commandsExecuted: 847 },
        endpoints: ['cli://tnf'],
        activeConnections: 4,
        resourceUsage: {
          cpu: Math.random() * 15 + 2,
          memory: Math.random() * 25 + 8,
          disk: Math.random() * 12 + 4,
          network: Math.random() * 8 + 1
        }
      }
    };
  }

  private async checkDatabaseHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '14.0.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { connections: 25, tablesCount: 47 },
        endpoints: ['postgresql://localhost:5432/tnf'],
        activeConnections: 25,
        resourceUsage: {
          cpu: Math.random() * 35 + 10,
          memory: Math.random() * 45 + 20,
          disk: Math.random() * 60 + 25,
          network: Math.random() * 18 + 6
        }
      }
    };
  }

  private async checkAPIGatewayHealth(): Promise<Partial<ComponentHealth>> {
    return {
      status: HealthStatus.HEALTHY,
      details: {
        version: '1.3.0',
        environment: process.env.NODE_ENV || 'development',
        configuration: { routes: 34, middleware: 8 },
        endpoints: ['http://localhost:3000', 'https://localhost:3443'],
        activeConnections: 42,
        resourceUsage: {
          cpu: Math.random() * 30 + 8,
          memory: Math.random() * 40 + 18,
          disk: Math.random() * 15 + 5,
          network: Math.random() * 25 + 12
        }
      }
    };
  }

  /**
   * Update component health data
   */
  private updateComponentHealth(component: SystemComponent, updates: Partial<ComponentHealth>): void {
    const current = this.componentHealth.get(component);
    if (!current) return;

    const updated: ComponentHealth = {
      ...current,
      ...updates,
      lastCheck: Date.now(),
      uptime: updates.status === HealthStatus.HEALTHY ? current.uptime + this.config.healthCheckInterval : current.uptime
    };

    this.componentHealth.set(component, updated);

    // Add metrics to history
    if (updated.details?.resourceUsage) {
      const timestamp = Date.now();
      ['cpu', 'memory', 'disk', 'network'].forEach(metric => {`;
        const key = $, { component }, $, { metric };
        ``;
        if (!this.metricsHistory.has(key)) {
            this.metricsHistory.set(key, []);
        }
        const history = this.metricsHistory.get(key);
        history.push({
            timestamp,
            value: updated.details.resourceUsage[metric],
            unit: metric === 'cpu' || metric === 'memory' || metric === 'disk' ? '%' : 'mbps'
        });
        // Keep only recent metrics
        const cutoff = timestamp - (this.config.metricsRetentionHours * 60 * 60 * 1000);
        this.metricsHistory.set(key, history.filter(point => point.timestamp > cutoff));
    }
});
collectMetrics();
void {
    // This would integrate with actual agent services to collect real metrics
    // For now, generating mock data
    const: mockAgents = [
        { id: 'agent-fed-001', type: 'federation-coordinator', component: SystemComponent.AGENT_FEDERATION },
        { id: 'terminal-orch-001', type: 'terminal-orchestrator', component: SystemComponent.TERMINAL_ORCHESTRATION },
        { id: 'vscode-bridge-001', type: 'vscode-bridge', component: SystemComponent.VSCODE_BRIDGE },
        { id: 'dacc-orchestrator-001', type: 'dacc-orchestrator', component: SystemComponent.DACC_SYSTEM },
        { id: 'protocol-coord-001', type: 'protocol-coordinator', component: SystemComponent.MULTI_PROTOCOL }
    ],
    mockAgents, : .forEach(agent => {
        const metrics = {
            agentId: agent.id,
            agentType: agent.type,
            systemComponent: agent.component,
            performance: {
                tasksCompleted: Math.floor(Math.random() * 100) + 50,
                tasksActive: Math.floor(Math.random() * 10) + 1,
                tasksFailed: Math.floor(Math.random() * 5),
                averageResponseTime: Math.random() * 1000 + 200,
                successRate: 0.85 + Math.random() * 0.15,
                throughput: Math.random() * 50 + 10
            },
            resources: {
                cpuUsage: Math.random() * 60 + 10,
                memoryUsage: Math.random() * 70 + 15,
                connectionCount: Math.floor(Math.random() * 20) + 5
            },
            status: HealthStatus.HEALTHY,
            lastActive: Date.now() - Math.floor(Math.random() * 30000)
        };
        this.agentMetrics.set(agent.id, metrics);
    })
};
processAlerts();
void {
    : .componentHealth
};
{
    for (const [ruleId, rule] of this.alertRules) {
        try {
            const alertResult = rule(health);
            if (alertResult) {
                const alertId = $, { ruleId };
                -$;
                {
                    component;
                }
                ;
                if (!this.activeAlerts.has(alertId)) {
                    const event = {
                        id: (0, uuid_1.v4)(),
                        timestamp: Date.now(),
                        component,
                        type: alertResult.type,
                        title: alertResult.title,
                        description: alertResult.description,
                        metadata: alertResult.metadata,
                        resolved: false
                    };
                    this.activeAlerts.set(alertId, event);
                    this.addSystemEvent(event);
                    // Broadcast alert to clients
                    this.broadcastToClients('new-alert', event);
                    `
              this.logger.warn(`;
                    Alert;
                    triggered: $;
                    {
                        event.title;
                    }
                    `);
            }
          } else {
            // Clear resolved alert
            const alertId = ${ruleId}-${component};
            if (this.activeAlerts.has(alertId)) {
              const alert = this.activeAlerts.get(alertId)!;
              alert.resolved = true;
              alert.resolvedAt = Date.now();
              this.activeAlerts.delete(alertId);

              this.broadcastToClients('alert-resolved', alert);`;
                    this.logger.log(Alert, resolved, $, { alert, : .title } `);
            }
          }
        } catch (error) {
          this.logger.error(Error processing alert rule ${ruleId}`, error);
                }
            }
        }
        finally {
        }
    }
    addSystemEvent(event, SystemEvent);
    void {
        this: .systemEvents.unshift(event),
        : .systemEvents.length > this.config.maxEventsToRetain
    };
    {
        this.systemEvents = this.systemEvents.slice(0, this.config.maxEventsToRetain);
    }
    this.eventEmitter.emit('dashboard.event.added', event);
}
handleAgentEvent(data, any);
void {
    const: event, SystemEvent = {
        id: (0, uuid_1.v4)(),
        timestamp: Date.now(),
        component: SystemComponent.AGENT_FEDERATION,
        type: data.level || 'info',
        title: Agent, Event: $
    }
};
{
    data.type || 'Unknown';
}
description: data.message || JSON.stringify(data),
    metadata;
data,
    resolved;
false;
;
this.addSystemEvent(event);
handleSystemEvent(data, any);
void {
    // Handle system-wide events
    this: .addSystemEvent({
        id: (0, uuid_1.v4)(),
        timestamp: Date.now(),
        component: SystemComponent.API_GATEWAY,
        type: 'info',
        title: 'System Event',
        description: data.message || JSON.stringify(data),
        metadata: data,
        resolved: false
    })
};
handleProtocolEvent(data, any);
void {
    // Update multi-protocol component metrics
    const: component = this.componentHealth.get(SystemComponent.MULTI_PROTOCOL),
    if(component) { }
} && data.type === 'message.sent';
{
    // Update connection count, throughput, etc.
}
handleTerminalEvent(data, any);
void {
    // Update terminal orchestration metrics
    const: component = this.componentHealth.get(SystemComponent.TERMINAL_ORCHESTRATION),
    if(component) {
        // Update based on terminal events
    }
};
handleVSCodeEvent(data, any);
void {
    // Update VSCode bridge metrics
    const: component = this.componentHealth.get(SystemComponent.VSCODE_BRIDGE),
    if(component) {
        // Update based on VSCode extension events
    }
};
/**
 * WebSocket message handlers
 */
handleGetDashboardData();
any;
{
    return {
        timestamp: Date.now(),
        componentHealth: Object.fromEntries(this.componentHealth),
        agentMetrics: Object.fromEntries(this.agentMetrics),
        recentEvents: this.systemEvents.slice(0, 50),
        activeAlerts: Array.from(this.activeAlerts.values()),
        metricsHistory: Object.fromEntries(this.metricsHistory)
    };
}
handleGetComponentDetails(data, { component: SystemComponent });
ComponentHealth | null;
{
    return this.componentHealth.get(data.component) || null;
}
handleGetMetricsHistory(data, { component: SystemComponent, metric: string, timeRange: number });
MetricDataPoint[];
{
    `
    const key = ${data.component}.${data.metric}` `;
    const history = this.metricsHistory.get(key) || [];
    const cutoff = Date.now() - data.timeRange;
    return history.filter(point => point.timestamp > cutoff);
  }

  /**
   * Broadcast message to all connected WebSocket clients
   */
  private broadcastToClients(event: string, data: any): void {
    if (this.server) {
      this.server.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({ event, data }));
        }
      });
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get current system overview
   */
  getSystemOverview(): any {
    const healthySystems = Array.from(this.componentHealth.values())
      .filter(h => h.status === HealthStatus.HEALTHY).length;
    const totalSystems = this.componentHealth.size;
    const activeAlerts = this.activeAlerts.size;
    const totalAgents = this.agentMetrics.size;

    return {
      timestamp: Date.now(),
      systemHealth: {
        healthyComponents: healthySystems,
        totalComponents: totalSystems,
        healthPercentage: (healthySystems / totalSystems) * 100
      },
      alerts: {
        active: activeAlerts,
        recent: this.systemEvents.filter(e => e.timestamp > Date.now() - 3600000).length // last hour
      },
      agents: {
        total: totalAgents,
        active: Array.from(this.agentMetrics.values())
          .filter(a => a.status === HealthStatus.HEALTHY).length
      },
      performance: {
        totalTasksCompleted: Array.from(this.agentMetrics.values())
          .reduce((sum, a) => sum + a.performance.tasksCompleted, 0),
        averageResponseTime: Array.from(this.agentMetrics.values())
          .reduce((sum, a) => sum + a.performance.averageResponseTime, 0) / totalAgents,
        overallSuccessRate: Array.from(this.agentMetrics.values())
          .reduce((sum, a) => sum + a.performance.successRate, 0) / totalAgents
      }
    };
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(ruleId: string, rule: Function): void {
    this.alertRules.set(ruleId, rule);
    this.logger.log(Added custom alert rule: ${ruleId});
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);`;
    this.logger.log(Removed, alert, rule, $, { ruleId } ``);
}
/**
 * Cleanup resources
 */
async;
cleanup();
Promise < void  > {
    this: .logger.log('Shutting down monitoring dashboard...'),
    : .healthCheckInterval, : .healthCheckInterval,
    : .metricsCollectionInterval, : .metricsCollectionInterval,
    : .alertProcessingInterval, : .alertProcessingInterval,
    this: .componentHealth.clear(),
    this: .agentMetrics.clear(),
    this: .systemEvents.length = 0,
    this: .dashboardWidgets.clear(),
    this: .metricsHistory.clear(),
    this: .alertRules.clear(),
    this: .activeAlerts.clear()
};
//# sourceMappingURL=agent-systems-monitoring-dashboard.service.js.map