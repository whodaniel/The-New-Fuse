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
exports.AgentBridgeService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
let AgentBridgeService = class AgentBridgeService {
    logger;
    config;
    connections = new Map();
    message_routes = new Map();
    message_queue = [];
    processing_queue = false;
    stats;
    start_time;
    constructor(logger) {
        this.logger = logger;
        this.start_time = new Date();
        this.initializeConfig();
        this.initializeStats();
        this.startQueueProcessor();
        this.logger.log('AgentBridgeService initialized', 'AgentBridgeService');
    }
    /**
     * Initialize bridge configuration
     */
    initializeConfig() {
        this.config = {
            maxConnections: parseInt(process.env.BRIDGE_MAX_CONNECTIONS || '1000'),
            messageTimeout: parseInt(process.env.BRIDGE_MESSAGE_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.BRIDGE_RETRY_ATTEMPTS || '3'),
            compression: process.env.BRIDGE_COMPRESSION !== 'false',
            encryption: process.env.BRIDGE_ENCRYPTION !== 'false'
        };
    }
    /**
     * Initialize bridge statistics
     */
    initializeStats() {
        this.stats = {
            total_connections: 0,
            active_connections: 0,
            messages_processed: 0,
            messages_failed: 0,
            average_latency: 0,
            uptime: 0
        };
    }
    /**
     * Register an agent connection
     */
    async registerConnection(agent_id, protocol, metadata = {}) {
        const connection_id = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 6)};
    
    // Check connection limits
    if (this.connections.size >= this.config.maxConnections!) {
      throw new Error('Maximum connection limit reached');
    }
    
    const connection: BridgeConnection = {
      id: connection_id,
      agent_id,
      protocol,
      status: 'connecting',
      last_activity: new Date(),
      created_at: new Date(),
      metadata
    };
    
    this.connections.set(connection_id, connection);
    this.stats.total_connections++;
    
    // Simulate connection process
    setTimeout(() => {
      connection.status = 'connected';
      this.stats.active_connections++;`;
        this.logger.log(Agent, connected, $, { agent_id } ` via ${protocol}`, 'AgentBridgeService');
    }
    100;
    ;
};
exports.AgentBridgeService = AgentBridgeService;
exports.AgentBridgeService = AgentBridgeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], AgentBridgeService);
return connection_id;
/**
 * Unregister an agent connection
 */
async;
unregisterConnection(connection_id, string);
Promise < boolean > {
    const: connection = this.connections.get(connection_id),
    if(, connection) {
        return false;
    },
    if(connection) { }, : .status === 'connected'
};
{
    this.stats.active_connections--;
}
connection.status = 'disconnected';
this.connections.delete(connection_id);
this.logger.log(Agent, disconnected, $, { connection, : .agent_id }, 'AgentBridgeService');
return true;
/**
 * Send message through the bridge
 */
async;
sendMessage(message, AgentCommunicationManager_1.AgentMessage);
Promise < boolean > {
    try: {
        const: start_time = Date.now(),
        : .validateMessage(message)
    }
};
{
    throw new Error('Invalid message format');
}
// Find or create route
const route = await this.findOrCreateRoute(message.fromAgentId, message.toAgentId);
// Add to processing queue
this.message_queue.push(message);
// Update route statistics
route.last_used = new Date();
const latency = Date.now() - start_time;
this.updateLatencyStats(latency);
`
      this.logger.log(Message queued: ${message.id}`, 'AgentBridgeService';
;
return true;
try { }
catch (error) {
    this.stats.messages_failed++;
    this.logger.error(Failed, to, send, message, $, { message, : .id } `, error instanceof Error ? error : new Error(String(error)), 'AgentBridgeService');
      return false;
    }
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcastMessage(message: AgentMessage, target_agents: string[]): Promise<number> {
    let successful_sends = 0;
    
    for (const agent_id of target_agents) {
      const broadcast_message: AgentMessage = {
        ...message,
        id: ${message.id}_${agent_id},
        toAgentId: agent_id
      };
      
      const success = await this.sendMessage(broadcast_message);
      if (success) {
        successful_sends++;
      }
    }` `
    this.logger.log(Broadcast completed: ${successful_sends}` / $, { target_agents, : .length }, successful, 'AgentBridgeService');
    return successful_sends;
}
async;
startQueueProcessor();
Promise < void  > {
    : .processing_queue
};
{
    return;
}
this.processing_queue = true;
const processQueue = async () => {
    while (this.message_queue.length > 0) {
        const message = this.message_queue.shift();
        if (message) {
            await this.processMessage(message);
        }
    }
    // Continue processing
    setTimeout(processQueue, 100);
};
processQueue();
async;
processMessage(message, AgentCommunicationManager_1.AgentMessage);
Promise < void  > {
    try: {
        const: target_connection = this.findAgentConnection(message.toAgentId),
        if(, target_connection) {
            throw new Error(No, connection, found);
            for (agent; ; )
                : $;
            {
                message.toAgentId;
            }
            ;
        }
        // Simulate message delivery based on protocol
        ,
        // Simulate message delivery based on protocol
        await, this: .deliverMessage(message, target_connection),
        this: .stats.messages_processed++
    } `
      // Update route success`,
    const: route_key = `${message.fromAgentId}_${message.toAgentId};
      const route = this.message_routes.get(route_key);
      if (route) {
        route.success_count++;
      }
      `,
    this: .logger.log(Message, delivered, $, { message, : .id } `, 'AgentBridgeService');
      
    } catch (error) {
      this.stats.messages_failed++;
      
      // Update route failure
      const route_key = ${message.fromAgentId}`, _$, { message, : .toAgentId }),
    const: route = this.message_routes.get(route_key),
    if(route) {
        route.failure_count++;
    }
} `
      this.logger.error(Message delivery failed: ${message.id}`, error instanceof Error ? error : new Error(String(error)), 'AgentBridgeService';
;
async;
deliverMessage(message, AgentCommunicationManager_1.AgentMessage, connection, BridgeConnection);
Promise < void  > {
    // Update connection activity
    connection, : .last_activity = new Date(),
    switch(connection) { }, : .protocol
};
{
    'websocket';
    await this.deliverViaWebSocket(message, connection);
    break;
    'http';
    await this.deliverViaHttp(message, connection);
    break;
    'redis';
    await this.deliverViaRedis(message, connection);
    break;
    'grpc';
    await this.deliverViaGrpc(message, connection);
    break;
    throw new Error(`Unsupported protocol: ${connection.protocol});
    }
  }

  /**
   * Deliver via WebSocket
   */
  private async deliverViaWebSocket(message: AgentMessage, connection: BridgeConnection): Promise<void> {
    // Simulate WebSocket delivery`, this.logger.log(Delivering, via, WebSocket, to, $, { connection, : .agent_id } ``, 'AgentBridgeService'));
}
async;
deliverViaHttp(message, AgentCommunicationManager_1.AgentMessage, connection, BridgeConnection);
Promise < void  > {
    // Simulate HTTP delivery
    this: .logger.log(Delivering, via, HTTP, to, $, { connection, : .agent_id }, 'AgentBridgeService')
};
async;
deliverViaRedis(message, AgentCommunicationManager_1.AgentMessage, connection, BridgeConnection);
Promise < void  > {
    // Simulate Redis pub/sub delivery`
    this: .logger.log(Delivering, via, Redis, to, $, { connection, : .agent_id } `, 'AgentBridgeService');
  }

  /**
   * Deliver via gRPC
   */
  private async deliverViaGrpc(message: AgentMessage, connection: BridgeConnection): Promise<void> {
    // Simulate gRPC delivery
    this.logger.log(Delivering via gRPC to ${connection.agent_id}`, 'AgentBridgeService')
};
findAgentConnection(agent_id, string);
BridgeConnection | null;
{
    for (const connection of this.connections.values()) {
        if (connection.agent_id === agent_id && connection.status === 'connected') {
            return connection;
        }
    }
    return null;
}
async;
findOrCreateRoute(from_agent, string, to_agent, string);
Promise < MessageRoute > {
    const: route_key = $
};
{
    from_agent;
}
_$;
{
    to_agent;
}
`;
    
    if (this.message_routes.has(route_key)) {
      return this.message_routes.get(route_key)!;
    }
    
    // Determine best protocol for route
    const from_connection = this.findAgentConnection(from_agent);
    const to_connection = this.findAgentConnection(to_agent);
    
    const protocol = this.selectOptimalProtocol(from_connection, to_connection);
    
    const route: MessageRoute = {
      id: route_key,
      from_agent,
      to_agent,
      protocol,
      priority: 'medium',
      created_at: new Date(),
      last_used: new Date(),
      success_count: 0,
      failure_count: 0
    };
    
    this.message_routes.set(route_key, route);
    return route;
  }

  /**
   * Select optimal protocol for communication
   */
  private selectOptimalProtocol(from_connection: BridgeConnection | null, to_connection: BridgeConnection | null): string {
    if (from_connection && to_connection) {
      // Prefer matching protocols
      if (from_connection.protocol === to_connection.protocol) {
        return from_connection.protocol;
      }
      
      // Fallback to most reliable protocol
      if (from_connection.protocol === 'grpc' || to_connection.protocol === 'grpc') {
        return 'grpc';
      }
      
      if (from_connection.protocol === 'websocket' || to_connection.protocol === 'websocket') {
        return 'websocket';
      }
    }
    
    return 'http'; // Default fallback
  }

  /**
   * Validate message format
   */
  private validateMessage(message: AgentMessage): boolean {
    return !!(message.id && message.fromAgentId && message.toAgentId && message.type);
  }

  /**
   * Update latency statistics
   */
  private updateLatencyStats(latency: number): void {
    const current_avg = this.stats.average_latency;
    const total_messages = this.stats.messages_processed + 1;
    this.stats.average_latency = ((current_avg * (total_messages - 1)) + latency) / total_messages;
  }

  /**
   * Get bridge statistics
   */
  getBridgeStats(): BridgeStats {
    this.stats.uptime = Date.now() - this.start_time.getTime();
    this.stats.active_connections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected').length;
    
    return { ...this.stats };
  }

  /**
   * Get active connections
   */
  getActiveConnections(): BridgeConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected');
  }

  /**
   * Get message routes
   */
  getMessageRoutes(): MessageRoute[] {
    return Array.from(this.message_routes.values());
  }

  /**
   * Get bridge configuration
   */
  getBridgeConfig(): BridgeConfig {
    return { ...this.config };
  }

  /**
   * Update bridge configuration
   */
  updateConfig(new_config: Partial<BridgeConfig>): void {
    this.config = { ...this.config, ...new_config };
    this.logger.log('Bridge configuration updated', 'AgentBridgeService');
  }

  /**
   * Health check for bridge service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = this.getBridgeStats();
    const active_connections = this.getActiveConnections();
    const error_rate = stats.messages_processed > 0 ? stats.messages_failed / stats.messages_processed : 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (error_rate > 0.1) {
      status = 'unhealthy';
    } else if (error_rate > 0.05 || active_connections.length === 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      details: {
        active_connections: active_connections.length,
        total_connections: stats.total_connections,
        messages_processed: stats.messages_processed,
        messages_failed: stats.messages_failed,
        error_rate: error_rate,
        average_latency: stats.average_latency,
        uptime: stats.uptime,
        queue_length: this.message_queue.length
      }
    };
  }
}

export default AgentBridgeService;
;
//# sourceMappingURL=agent-bridge.service.js.map