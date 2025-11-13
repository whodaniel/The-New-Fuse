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
exports.A2AService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const LoggingService_1 = require("./LoggingService");
const MetricsService_1 = require("./MetricsService");
let A2AService = class A2AService {
    loggingService;
    metricsService;
    eventEmitter;
    agents = new Map();
    connections = new Map();
    messages = new Map();
    capabilities = new Map();
    agentNameIndex = new Map();
    constructor(loggingService, metricsService, eventEmitter) {
        this.loggingService = loggingService;
        this.metricsService = metricsService;
        this.eventEmitter = eventEmitter;
        this.initializeDefaultCapabilities();
    }
    initializeDefaultCapabilities() {
        // Register default A2A capabilities
        const defaultCapabilities = [
            {
                id: 'text_generation',
                name: 'Text Generation',
                description: 'Generate human-like text responses',
                version: '1.0.0',
                parameters: {
                    max_tokens: { type: 'number', default: 1000 },
                    temperature: { type: 'number', default: 0.7 },
                },
            },
            {
                id: 'code_analysis',
                name: 'Code Analysis',
                description: 'Analyze and understand code structure',
                version: '1.0.0',
                parameters: {
                    language: { type: 'string', required: true },
                },
            },
            {
                id: 'data_processing',
                name: 'Data Processing',
                description: 'Process and transform data',
                version: '1.0.0',
                parameters: {
                    format: { type: 'string', default: 'json' },
                },
            },
            {
                id: 'web_search',
                name: 'Web Search',
                description: 'Search and retrieve information from the web',
                version: '1.0.0',
                parameters: {
                    query: { type: 'string', required: true },
                    max_results: { type: 'number', default: 10 },
                },
            },
        ];
        defaultCapabilities.forEach(capability => {
            this.capabilities.set(capability.id, capability);
        });
    }
    async registerAgent(createAgentDto) {
        const { name, type, capabilities, endpoint, metadata } = createAgentDto;
        // Validate uniqueness
        if (this.agentNameIndex.has(name)) {
            throw new common_1.ConflictException(`Agent with name ${name} already exists);
    }

    // Validate capabilities
    for (const capabilityId of capabilities) {
      if (!this.capabilities.has(capabilityId)) {`);
            throw new common_1.BadRequestException(`Capability ${capabilityId}`, is, not, recognized);
        }
    }
    agent = {
        id: this.generateId('agent'),
        name,
        type,
        capabilities,
        endpoint,
        status: 'connecting',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata,
    };
};
exports.A2AService = A2AService;
exports.A2AService = A2AService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService,
        event_emitter_1.EventEmitter2])
], A2AService);
// Store agent
this.agents.set(agent.id, agent);
this.agentNameIndex.set(name, agent.id);
// Record metrics
this.metricsService.incrementCounter('agents.registered', 1, { labels: { type } });
this.metricsService.incrementCounter('agents.total', 1, {});
// Log activity
this.loggingService.log(Agent, registered, $, { name }($, { type }), 'A2AService');
// Emit event
this.eventEmitter.emit('agent.registered', {
    agentId: agent.id,
    name: agent.name,
    type: agent.type,
    capabilities: agent.capabilities,
});
// Simulate connection establishment
setTimeout(() => {
    this.updateAgent(agent.id, { status: 'active' });
}, 1000);
return agent;
async;
updateAgent(id, string, updateAgentDto, UpdateAgentDto);
Promise < A2AAgent > {
    const: agent = this.agents.get(id),
    if(, agent) {
        `
      throw new NotFoundException(Agent with ID ${id}`;
        not;
        found;
        ;
    },
    const: { name, type, capabilities, endpoint, status, metadata } = updateAgentDto,
    // Handle name change
    if(name) { }
} && name !== agent.name;
{
    if (this.agentNameIndex.has(name)) {
        throw new common_1.ConflictException(Agent);
        with (name)
            $;
        {
            name;
        }
        already;
        exists `);
      }
      this.agentNameIndex.delete(agent.name);
      this.agentNameIndex.set(name, agent.id);
      agent.name = name;
    }

    // Validate capabilities if being updated
    if (capabilities) {
      for (const capabilityId of capabilities) {
        if (!this.capabilities.has(capabilityId)) {
          throw new BadRequestException(Capability ${capabilityId} is not recognized);
        }
      }
      agent.capabilities = capabilities;
    }

    // Update other fields
    if (type) agent.type = type;
    if (endpoint) agent.endpoint = endpoint;
    if (status) agent.status = status;
    if (metadata) agent.metadata = { ...agent.metadata, ...metadata };

    agent.updatedAt = new Date();

    // Record metrics
    this.metricsService.incrementCounter('agents.updated', 1, { labels: { type: agent.type } });
`;
        // Log activity`
        this.loggingService.log(`Agent updated: ${agent.name}, 'A2AService');

    // Emit event
    this.eventEmitter.emit('agent.updated', {
      agentId: agent.id,
      name: agent.name,
      changes: Object.keys(updateAgentDto),
    });

    return agent;
  }

  async unregisterAgent(id: string): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) {`);
        throw new common_1.NotFoundException(Agent);
        with (ID)
            $;
        {
            id;
        }
        not;
        found `);
    }

    // Close all connections involving this agent
    const connectionsToClose = Array.from(this.connections.values())
      .filter(conn => conn.fromAgentId === id || conn.toAgentId === id);

    for (const connection of connectionsToClose) {
      await this.closeConnection(connection.id);
    }

    // Remove from indexes
    this.agentNameIndex.delete(agent.name);

    // Remove agent
    this.agents.delete(id);

    // Record metrics
    this.metricsService.incrementCounter('agents.unregistered', 1, { labels: { type: agent.type } });
    this.metricsService.incrementCounter('agents.total', -1, {});

    // Log activity
    this.loggingService.log(Agent unregistered: ${agent.name}`, 'A2AService';
        ;
        // Emit event
        this.eventEmitter.emit('agent.unregistered', {
            agentId: id,
            name: agent.name,
            type: agent.type,
        });
    }
    async;
    findAgentById(id, string);
    Promise < A2AAgent | null > {
        return: this.agents.get(id) || null
    };
    async;
    getAgent(id, string);
    Promise < A2AAgent | null > {
        const: agent = await this.findAgentById(id),
        return: agent ? this.enrichAgentForHealth(agent) : null
    };
    async;
    findAgentByName(name, string);
    Promise < A2AAgent | null > {
        const: agentId = this.agentNameIndex.get(name),
        if(, agentId) { }, return: null,
        return: this.agents.get(agentId) || null
    };
    async;
    findAllAgents(filter ?  : AgentFilter);
    Promise < A2AAgent[] > {
        let, agents = Array.from(this.agents.values()),
        if(filter) {
            if (filter.type) {
                agents = agents.filter(agent => agent.type === filter.type);
            }
            if (filter.status) {
                agents = agents.filter(agent => agent.status === filter.status);
            }
            if (filter.capability) {
                agents = agents.filter(agent => agent.capabilities.includes(filter.capability));
            }
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                agents = agents.filter(agent => agent.name.toLowerCase().includes(searchLower) ||
                    agent.capabilities.some(cap => cap.toLowerCase().includes(searchLower)));
            }
        },
        return: agents
    };
    async;
    establishConnection(fromAgentId, string, toAgentId, string);
    Promise < A2AConnection > {
        const: fromAgent = this.agents.get(fromAgentId),
        const: toAgent = this.agents.get(toAgentId),
        if(, fromAgent) {
            throw new common_1.NotFoundException(Source, agent, $, { fromAgentId }, not, found);
        },
        if(, toAgent) {
            `
      throw new NotFoundException(Target agent ${toAgentId}` ` not found);
    }

    // Check if connection already exists
    const existingConnection = Array.from(this.connections.values())
      .find(conn => conn.fromAgentId === fromAgentId && conn.toAgentId === toAgentId);

    if (existingConnection) {
      return existingConnection;
    }

    const connection: A2AConnection = {
      id: this.generateId('connection'),
      fromAgentId,
      toAgentId,
      status: 'pending',
      metadata: {
        requestedAt: new Date(),
      },
    };

    this.connections.set(connection.id, connection);

    // Simulate connection establishment
    setTimeout(() => {
      connection.status = 'established';
      connection.establishedAt = new Date();
      connection.lastActivityAt = new Date();

      this.eventEmitter.emit('connection.established', {
        connectionId: connection.id,
        fromAgentId,
        toAgentId,
      });
    }, 500);

    // Record metrics
    this.metricsService.incrementCounter('connections.established', 1, {});

    // Log activity
    this.loggingService.log(Connection established: ${fromAgent.name} -> ${toAgent.name}, 'A2AService');

    return connection;
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {`;
            throw new common_1.NotFoundException(Connection, $, { connectionId } ` not found);
    }

    connection.status = 'closed';

    // Record metrics
    this.metricsService.incrementCounter('connections.closed', 1, {});

    // Log activity
    this.loggingService.log(Connection closed: ${connection.id}`, 'A2AService');
            // Emit event
            this.eventEmitter.emit('connection.closed', {
                connectionId: connection.id,
                fromAgentId: connection.fromAgentId,
                toAgentId: connection.toAgentId,
            });
        },
        async sendMessage(fromAgentId, toAgentId, message) {
            const fromAgent = this.agents.get(fromAgentId);
            const toAgent = this.agents.get(toAgentId);
            if (!fromAgent) {
                throw new common_1.NotFoundException(Source, agent, $, { fromAgentId }, not, found);
            }
            if (!toAgent) {
                `
      throw new NotFoundException(Target agent ${toAgentId}`;
                not;
                found;
                ;
            }
            // Check if connection exists
            const connection = Array.from(this.connections.values())
                .find(conn => conn.fromAgentId === fromAgentId && conn.toAgentId === toAgentId && conn.status === 'established');
            if (!connection) {
                throw new common_1.BadRequestException(No, established, connection, between, $, { fromAgentId } ` and ${toAgentId});
    }

    const fullMessage: A2AMessage = {
      id: this.generateId('message'),
      ...message,
      fromAgentId,
      toAgentId,
      createdAt: new Date(),
    };

    this.messages.set(fullMessage.id, fullMessage);

    // Update connection activity
    connection.lastActivityAt = new Date();

    // Record metrics
    this.metricsService.incrementCounter('messages.sent', 1, {
      labels: {
        type: message.type,
        priority: message.priority
      }
    });

    // Log activity`, this.loggingService.log(Message, sent, $, { fromAgent, : .name } ` -> ${toAgent.name}`($, { message, : .type }), 'A2AService'));
                // Emit event
                this.eventEmitter.emit('message.sent', {
                    messageId: fullMessage.id,
                    fromAgentId,
                    toAgentId,
                    type: message.type,
                    priority: message.priority,
                });
                return fullMessage;
            }
            async;
            getMessage(messageId, string);
            Promise < A2AMessage | null > {
                return: this.messages.get(messageId) || null
            };
            async;
            getAgentMessages(agentId, string, limit, number = 100);
            Promise < A2AMessage[] > {
                const: messages = Array.from(this.messages.values())
                    .filter(msg => msg.fromAgentId === agentId || msg.toAgentId === agentId)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, limit),
                return: messages
            };
            async;
            getCapability(capabilityId, string);
            Promise < A2ACapability | null > {
                return: this.capabilities.get(capabilityId) || null
            };
            async;
            getAllCapabilities();
            Promise < A2ACapability[] > {
                return: Array.from(this.capabilities.values())
            };
            async;
            registerCapability(capability, (Omit));
            Promise < A2ACapability > {
                const: fullCapability, A2ACapability = {
                    id: this.generateId('capability'),
                    ...capability,
                },
                this: .capabilities.set(fullCapability.id, fullCapability),
                // Record metrics
                this: .metricsService.incrementCounter('capabilities.registered', 1, {}),
                // Log activity`
                this: .loggingService.log(`Capability registered: ${fullCapability.name}`, 'A2AService'),
                return: fullCapability
            };
            getA2AStats();
            A2AStats;
            {
                const agents = Array.from(this.agents.values());
                const connections = Array.from(this.connections.values());
                const messages = Array.from(this.messages.values());
                const now = new Date();
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                const stats = {
                    totalAgents: agents.length,
                    activeAgents: agents.filter(agent => agent.status === 'active').length,
                    totalConnections: connections.length,
                    activeConnections: connections.filter(conn => conn.status === 'established').length,
                    totalMessages: messages.length,
                    messagesThisHour: messages.filter(msg => msg.createdAt >= oneHourAgo).length,
                    agentsByType: {},
                    agentsByStatus: {},
                };
                // Count agents by type
                agents.forEach(agent => {
                    stats.agentsByType[agent.type] = (stats.agentsByType[agent.type] || 0) + 1;
                });
                // Count agents by status
                agents.forEach(agent => {
                    stats.agentsByStatus[agent.status] = (stats.agentsByStatus[agent.status] || 0) + 1;
                });
                return stats;
            }
            // Health check methods for A2AHealthIndicator
            async;
            getConnectedAgents();
            Promise < A2AAgent[] > {
                return: this.findAllAgents({ status: 'active' })
            };
            async;
            getMessageQueueStats();
            Promise < any > {
                const: messages = Array.from(this.messages.values()),
                const: now = new Date(),
                const: oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000),
                return: {
                    queueSize: messages.length,
                    processingRate: messages.filter(msg => msg.createdAt >= oneHourAgo).length,
                    failedMessages: 0, // Placeholder - implement based on your error tracking
                    averageProcessingTime: 100, // Placeholder - implement based on your metrics
                    maxQueueSize: 10000, // Configurable limit
                }
            };
            async;
            getDiscoveryStats();
            Promise < any > {
                const: agents = Array.from(this.agents.values()),
                return: {
                    registeredAgents: agents.length,
                    activeDiscoveries: 0, // Placeholder - implement based on your discovery logic
                    discoveryRequests: 0, // Placeholder - implement based on your metrics
                    averageDiscoveryTime: 50, // Placeholder - implement based on your metrics
                    successRate: 0.95, // Placeholder - implement based on your metrics
                }
            };
            async;
            getSecurityStats();
            Promise < any > {
                return: {
                    activeSessions: 0, // Placeholder - implement based on your session tracking
                    authenticationRequests: 0, // Placeholder - implement based on your auth metrics
                    authorizationFailures: 0, // Placeholder - implement based on your auth metrics
                    securityEvents: 0, // Placeholder - implement based on your security logging
                }
            };
            async;
            getPersistenceStats();
            Promise < any > {
                const: messages = Array.from(this.messages.values()),
                return: {
                    storedMessages: messages.length,
                    storageSize: JSON.stringify(messages).length, // Rough estimate
                    cleanupJobs: 0, // Placeholder - implement based on your cleanup logic
                    averageStorageTime: 10, // Placeholder - implement based on your metrics
                }
            };
            async;
            getServiceHealth(serviceName, string);
            Promise < any > {
                // Placeholder implementation - customize based on your service architecture
                return: {
                    status: 'healthy',
                    uptime: process.uptime() * 1000,
                    version: '1.0.0',
                    dependencies: [],
                    metrics: {},
                    lastCheck: new Date(),
                }
            };
            async;
            getSystemHealth();
            Promise < any > {
                const: memUsage = process.memoryUsage(),
                return: {
                    status: 'healthy',
                    platform: process.platform,
                    nodeVersion: process.version,
                    memory: {
                        used: memUsage.heapUsed,
                        total: memUsage.heapTotal,
                        external: memUsage.external,
                    },
                    cpu: {
                        usage: 0, // Placeholder - implement CPU monitoring if needed
                    },
                    disk: {
                        usage: 0, // Placeholder - implement disk monitoring if needed
                    },
                    network: {
                        connections: 0, // Placeholder - implement network monitoring if needed
                    },
                    services: [],
                    dependencies: [],
                    performance: {
                        uptime: process.uptime() * 1000,
                    },
                    alerts: [],
                }
            };
            // Add logInteraction method for A2AInterceptor
            async;
            logInteraction(logEntry, any);
            Promise < void  > {
                // Placeholder implementation - customize based on your logging needs
                this: .loggingService.log(A2A, Interaction, $, { JSON, : .stringify(logEntry) }, 'A2AService')
            };
            // Add logError method for A2AExceptionFilter
            async;
            logError(logEntry, any);
            Promise < void  > {
                : .loggingService.error === 'function'
            };
            {
                `
      this.loggingService.error(A2A Error: ${JSON.stringify(logEntry)}`, undefined, 'A2AService';
                ;
            }
        }, else: {
            this: .loggingService.log(A2A, Error, $, { JSON, : .stringify(logEntry) }, 'A2AService')
        }
        // Record error metrics
        ,
        // Record error metrics
        this: .metricsService.incrementCounter('a2a.errors', 1, {
            labels: {
                type: logEntry.type || 'unknown',
                severity: logEntry.severity || 'error'
            }
        }),
        // Emit error event for monitoring
        this: .eventEmitter.emit('a2a.error', {
            timestamp: new Date(),
            ...logEntry
        })
    };
    enrichAgentForHealth(agent, A2AAgent);
    A2AAgent;
    {
        return {
            ...agent,
            lastSeen: agent.lastSeenAt,
            version: agent.metadata?.version || '1.0.0',
            uptime: agent.metadata?.uptime || 0,
            memoryUsage: agent.metadata?.memoryUsage || { used: 0, total: 0 },
            cpuUsage: agent.metadata?.cpuUsage || 0,
            messageQueue: agent.metadata?.messageQueue || { size: 0, pending: 0 },
            activeConnections: agent.metadata?.activeConnections || 0,
            errorRate: agent.metadata?.errorRate || 0,
            responseTime: agent.metadata?.responseTime || 0,
        };
    }
    // Explicit subscription APIs for bridge communication
    /**
     * Subscribe to message sent events
     * @param callback Function to call when a message is sent
     * @returns Unsubscribe function
     */
    onMessageSent(callback, (event) => void );
    () => void {
        this: .eventEmitter.on('message.sent', callback),
        return() { }, this: .eventEmitter.off('message.sent', callback)
    };
    /**
     * Subscribe to agent registered events
     * @param callback Function to call when an agent is registered
     * @returns Unsubscribe function
     */
    onAgentRegistered(callback, (event) => void );
    () => void {
        this: .eventEmitter.on('agent.registered', callback),
        return() { }, this: .eventEmitter.off('agent.registered', callback)
    };
    /**
     * Subscribe to agent updated events
     * @param callback Function to call when an agent is updated
     * @returns Unsubscribe function
     */
    onAgentUpdated(callback, (event) => void );
    () => void {
        this: .eventEmitter.on('agent.updated', callback),
        return() { }, this: .eventEmitter.off('agent.updated', callback)
    };
    /**
     * Subscribe to agent unregistered events
     * @param callback Function to call when an agent is unregistered
     * @returns Unsubscribe function
     */
    onAgentUnregistered(callback, (event) => void );
    () => void {
        this: .eventEmitter.on('agent.unregistered', callback),
        return() { }, this: .eventEmitter.off('agent.unregistered', callback)
    };
    /**
     * Subscribe to connection established events
     * @param callback Function to call when a connection is established
     * @returns Unsubscribe function
     */
    onConnectionEstablished(callback, (event) => void );
    () => void {
        this: .eventEmitter.on('connection.established', callback),
        return() { }, this: .eventEmitter.off('connection.established', callback)
    };
    /**
     * Subscribe to connection closed events
     * @param callback Function to call when a connection is closed
     * @returns Unsubscribe function
     */
    onConnectionClosed(callback, (event) => void );
    () => void {
        this: .eventEmitter.on('connection.closed', callback),
        return() { }, this: .eventEmitter.off('connection.closed', callback)
    } `
  // Helper methods`;
    generateId(prefix, string);
    string;
    {
        return $;
        {
            prefix;
        }
        `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.default = A2AService;
//# sourceMappingURL=A2AService.js.map