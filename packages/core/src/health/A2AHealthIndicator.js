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
var A2AHealthIndicator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const A2AService_1 = require("../services/A2AService");
const A2AConfig_1 = require("../config/A2AConfig");
const errors_1 = require("../utils/errors");
let A2AHealthIndicator = A2AHealthIndicator_1 = class A2AHealthIndicator extends terminus_1.HealthIndicator {
    a2aService;
    config;
    logger = new common_1.Logger(A2AHealthIndicator_1.name);
    constructor(a2aService, config) {
        super();
        this.a2aService = a2aService;
        this.config = config;
    }
    async isHealthy(key = 'a2a') {
        try {
            const healthChecks = await Promise.allSettled([
                this.checkAgentConnectivity(),
                this.checkMessageQueue(),
                this.checkDiscoveryService(),
                this.checkSecurityService(),
                this.checkPersistenceService(),
            ]);
            const results = {
                agentConnectivity: healthChecks[0],
                messageQueue: healthChecks[1],
                discoveryService: healthChecks[2],
                securityService: healthChecks[3],
                persistenceService: healthChecks[4],
            };
            const failedChecks = Object.entries(results)
                .filter(([_, result]) => result.status === 'rejected')
                .map(([name, result]) => ({
                name,
                error: result.status === 'rejected' ? result.reason : null,
            }));
            const isHealthy = failedChecks.length === 0;
            const status = isHealthy ? 'up' : 'down';
            const healthData = {
                status,
                timestamp: new Date().toISOString(),
                checks: {
                    agentConnectivity: this.extractResult(results.agentConnectivity),
                    messageQueue: this.extractResult(results.messageQueue),
                    discoveryService: this.extractResult(results.discoveryService),
                    securityService: this.extractResult(results.securityService),
                    persistenceService: this.extractResult(results.persistenceService),
                },
                summary: {
                    total: healthChecks.length,
                    passed: healthChecks.length - failedChecks.length,
                    failed: failedChecks.length,
                },
                config: {
                    agentDiscoveryEnabled: this.config.enableAgentDiscovery,
                    agentRegistrationEnabled: this.config.enableAgentRegistration,
                    securityEnabled: this.config.enableSecurity,
                    encryptionEnabled: this.config.enableEncryption,
                    circuitBreakerEnabled: this.config.enableCircuitBreaker,
                    loadBalancingEnabled: this.config.enableLoadBalancing,
                    cachingEnabled: this.config.enableCaching,
                    metricsEnabled: this.config.enableMetrics,
                    healthChecksEnabled: this.config.enableHealthChecks,
                },
            };
            if (isHealthy) {
                return this.getStatus(key, true, healthData);
            }
            else {
                throw new terminus_1.HealthCheckError(`A2A health check failed: ${failedChecks.map(c => c.name).join(', ')},
          this.getStatus(key, false, healthData),
        );
      }
    } catch (error) {`, this.logger.error(`A2A health check failed: ${(0, errors_1.getErrorMessage)(error)}`, (0, errors_1.getErrorStack)(error)));
                throw new terminus_1.HealthCheckError('A2A health check failed', this.getStatus(key, false, {
                    status: 'down',
                    timestamp: new Date().toISOString(),
                    error: (0, errors_1.getErrorMessage)(error),
                    stack: (0, errors_1.getErrorStack)(error),
                }));
            }
        }
        finally {
        }
    }
    async checkAgentConnectivity() {
        try {
            const agents = await this.a2aService.getConnectedAgents();
            const onlineAgents = agents.filter(agent => this.isAgentOnline(agent.status));
            return {
                status: 'up',
                totalAgents: agents.length,
                onlineAgents: onlineAgents.length,
                offlineAgents: agents.filter(agent => !this.isAgentOnline(agent.status)).length,
                agents: agents.map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    status: agent.status,
                    lastSeen: agent.lastSeen,
                    capabilities: agent.capabilities,
                })),
            };
        }
        catch (error) {
            this.logger.warn(Agent, connectivity, check, failed, $, {});
            `
      throw new Error(Agent connectivity check failed: ${(0, errors_1.getErrorMessage)(error)}`;
            ;
        }
    }
    async checkMessageQueue() {
        try {
            const queueStats = await this.a2aService.getMessageQueueStats();
            return {
                status: 'up',
                queueSize: queueStats.queueSize,
                processingRate: queueStats.processingRate,
                failedMessages: queueStats.failedMessages,
                averageProcessingTime: queueStats.averageProcessingTime,
                maxQueueSize: queueStats.maxQueueSize,
                isHealthy: queueStats.queueSize < queueStats.maxQueueSize * 0.9, // Alert if queue is 90% full
            };
        }
        catch (error) {
            this.logger.warn(Message, queue, check, failed, $, {});
            `
      throw new Error(Message queue check failed: ${(0, errors_1.getErrorMessage)(error)});
    }
  }

  private async checkDiscoveryService(): Promise<any> {
    if (!this.config.enableAgentDiscovery) {
      return {
        status: 'disabled',
        message: 'Agent discovery is disabled',
      };
    }

    try {
      const discoveryStats = await this.a2aService.getDiscoveryStats();
      
      return {
        status: 'up',
        registeredAgents: discoveryStats.registeredAgents,
        activeDiscoveries: discoveryStats.activeDiscoveries,
        discoveryRequests: discoveryStats.discoveryRequests,
        averageDiscoveryTime: discoveryStats.averageDiscoveryTime,
        successRate: discoveryStats.successRate,
      };
    } catch (error) {`;
            this.logger.warn(Discovery, service, check, failed, $, {});
            `
      throw new Error(Discovery service check failed: ${(0, errors_1.getErrorMessage)(error)}`;
            ;
        }
    }
    async checkSecurityService() {
        if (!this.config.enableSecurity) {
            return {
                status: 'disabled',
                message: 'Security service is disabled',
            };
        }
        try {
            const securityStats = await this.a2aService.getSecurityStats();
            return {
                status: 'up',
                activeSessions: securityStats.activeSessions,
                authenticationRequests: securityStats.authenticationRequests,
                authorizationFailures: securityStats.authorizationFailures,
                encryptionEnabled: this.config.enableEncryption,
                trustedAgents: this.config.trustedAgents.length,
                blockedAgents: this.config.blockedAgents.length,
                securityEvents: securityStats.securityEvents,
            };
        }
        catch (error) {
            this.logger.warn(Security, service, check, failed, $, {});
            `
      throw new Error(Security service check failed: ${(0, errors_1.getErrorMessage)(error)}`;
            ;
        }
    }
    async checkPersistenceService() {
        if (!this.config.enableMessagePersistence) {
            return {
                status: 'disabled',
                message: 'Message persistence is disabled',
            };
        }
        try {
            const persistenceStats = await this.a2aService.getPersistenceStats();
            return {
                status: 'up',
                provider: this.config.persistenceProvider,
                storedMessages: persistenceStats.storedMessages,
                storageSize: persistenceStats.storageSize,
                retentionDays: this.config.messageRetentionDays,
                cleanupJobs: persistenceStats.cleanupJobs,
                averageStorageTime: persistenceStats.averageStorageTime,
            };
        }
        catch (error) {
            this.logger.warn(Persistence, service, check, failed, $, {} `);
      throw new Error(Persistence service check failed: ${(0, errors_1.getErrorMessage)(error)});
    }
  }

  private extractResult(result: PromiseSettledResult<any>): any {
    if (result.status === 'fulfilled') {
      return {
        status: 'up',
        ...result.value,
      };
    } else {
      return {
        status: 'down',
        error: result.reason?.message || 'Unknown error',
      };
    }
  }

  async checkAgentHealth(agentId: string): Promise<HealthIndicatorResult> {
    try {
      const agent = await this.a2aService.getAgent(agentId);
      
      if (!agent) {
        throw new HealthCheckError(`, Agent, not, found, $, { agentId }, `
          this.getStatus(a2a-agent-${agentId}`, false, {
                status: 'down',
                message: Agent, not, found: $
            }, { agentId }, timestamp, new Date().toISOString());
        }
        ;
    }
    healthData = {
        status: this.isAgentOnline(agent.status) ? 'up' : 'down',
        agentId: agent.id,
        agentName: agent.name,
        agentStatus: agent.status,
        lastSeen: agent.lastSeen,
        capabilities: agent.capabilities,
        version: agent.version,
        uptime: agent.uptime,
        memoryUsage: agent.memoryUsage,
        cpuUsage: agent.cpuUsage,
        messageQueue: agent.messageQueue,
        activeConnections: agent.activeConnections,
        errorRate: agent.errorRate,
        responseTime: agent.responseTime,
    };
    isHealthy = this.isAgentOnline(agent.status) &&
        (agent.errorRate ?? 1) < 0.1 && // Less than 10% error rate
        (agent.responseTime ?? Infinity) < 5000;
}; // Less than 5 seconds response time
exports.A2AHealthIndicator = A2AHealthIndicator;
exports.A2AHealthIndicator = A2AHealthIndicator = A2AHealthIndicator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [A2AService_1.A2AService,
        A2AConfig_1.A2AConfig])
], A2AHealthIndicator);
`
      if (isHealthy) {`;
return this.getStatus(`a2a-agent-${agentId}, true, healthData);
      } else {`);
throw new terminus_1.HealthCheckError(`
          Agent health check failed: ${agentId}`, this.getStatus(a2a - agent - $, { agentId }, false, healthData));
try { }
catch (error) {
    `
      this.logger.error(Agent health check failed for ${agentId}`;
    $;
    {
        (0, errors_1.getErrorMessage)(error);
    }
    `, getErrorStack(error));
      throw new HealthCheckError(
        Agent health check failed: ${agentId},`;
    this.getStatus(`a2a-agent-${agentId}, false, {
          status: 'down',
          agentId,
          timestamp: new Date().toISOString(),
          error: getErrorMessage(error),
        }),
      );
    }
  }

  async checkServiceHealth(serviceName: string): Promise<HealthIndicatorResult> {
    try {
      const serviceHealth = await this.a2aService.getServiceHealth(serviceName);
      
      const healthData = {
        status: serviceHealth.status,
        serviceName,
        timestamp: new Date().toISOString(),
        uptime: serviceHealth.uptime,
        version: serviceHealth.version,
        dependencies: serviceHealth.dependencies,
        metrics: serviceHealth.metrics,
        lastCheck: serviceHealth.lastCheck,`);
}
;
`

      if (serviceHealth.status === 'healthy') {
        return this.getStatus(a2a-service-${serviceName}`, true, healthData;
;
{
    throw new terminus_1.HealthCheckError(Service, health, check, failed, $, { serviceName } `,
          this.getStatus(a2a-service-${serviceName}, false, healthData),
        );
      }
    } catch (error) {`, this.logger.error(`Service health check failed for ${serviceName}: ${(0, errors_1.getErrorMessage)(error)}, getErrorStack(error));`));
    throw new terminus_1.HealthCheckError(Service, health, check, failed, $, { serviceName }, `
        this.getStatus(a2a-service-${serviceName}`, false, {
        status: 'down',
        serviceName,
        timestamp: new Date().toISOString(),
        error: (0, errors_1.getErrorMessage)(error),
    }),
    ;
    ;
}
async;
checkSystemHealth();
Promise < terminus_1.HealthIndicatorResult > {
    try: {
        const: systemHealth = await this.a2aService.getSystemHealth(),
        const: healthData = {
            status: systemHealth.status,
            timestamp: new Date().toISOString(),
            systemInfo: {
                platform: systemHealth.platform,
                nodeVersion: systemHealth.nodeVersion,
                memory: systemHealth.memory,
                cpu: systemHealth.cpu,
                disk: systemHealth.disk,
                network: systemHealth.network,
            },
            services: systemHealth.services,
            dependencies: systemHealth.dependencies,
            performance: systemHealth.performance,
            alerts: systemHealth.alerts,
        },
        const: isHealthy = systemHealth.status === 'healthy' &&
            systemHealth.alerts.length === 0,
        if(isHealthy) {
            return this.getStatus('a2a-system', true, healthData);
        }, else: {
            throw: new terminus_1.HealthCheckError('System health check failed', this.getStatus('a2a-system', false, healthData))
        }
    }, catch(error) {
        this.logger.error(System, health, check, failed, $, {} `, getErrorStack(error));
      throw new HealthCheckError(
        'System health check failed',
        this.getStatus('a2a-system', false, {
          status: 'down',
          timestamp: new Date().toISOString(),
          error: getErrorMessage(error),
        }),
      );
    }
  }

  /**
   * Maps agent status values to online/offline logic
   * Treats 'active' as online and others as offline
   */
  private isAgentOnline(status: string): boolean {
    return status === 'active';
  }
});
    }
};
//# sourceMappingURL=A2AHealthIndicator.js.map