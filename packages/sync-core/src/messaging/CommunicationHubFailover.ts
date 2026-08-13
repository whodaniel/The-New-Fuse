import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import {
  MessageFailoverConfig,
  SyncAwareA2AMessage,
  SyncAwareMessageUtils,
} from './SyncAwareA2AMessage';

export interface CommunicationNode {
  id: string;
  type: 'primary' | 'fallback' | 'emergency';
  endpoint: string;
  status: 'healthy' | 'degraded' | 'failed' | 'recovering';
  lastHealthCheck: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  responseTime: number;
  capacity: number;
  currentLoad: number;
}

export interface FailoverEvent {
  id: string;
  type: 'node_failure' | 'node_recovery' | 'circuit_breaker_open' | 'circuit_breaker_close';
  nodeId: string;
  timestamp: number;
  reason: string;
  metadata: Record<string, any>;
}

export interface CircuitBreakerState {
  nodeId: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
  halfOpenCallCount: number;
}

/**
 * Communication Hub Failover Manager
 * Implements failover mechanisms using existing communication hub patterns
 */
@Injectable()
export class CommunicationHubFailover implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommunicationHubFailover.name);

  private nodes: Map<string, CommunicationNode> = new Map();
  private failoverConfigs: Map<string, MessageFailoverConfig> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private failoverEvents: FailoverEvent[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private routingTable: Map<string, string[]> = new Map(); // tenantId -> nodeIds

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly redisConfig: SyncRedisConfig
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadFailoverConfigurations();
    await this.initializeCommunicationNodes();
    await this.startHealthChecking();
    this.startFailoverEventProcessing();
    this.logger.log('CommunicationHubFailover initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('CommunicationHubFailover destroyed');
  }

  /**
   * Configure failover settings for message delivery
   */
  async configureFailover(tenantId: string, config: MessageFailoverConfig): Promise<void> {
    try {
      this.failoverConfigs.set(tenantId, config);

      // Initialize circuit breakers for all nodes
      for (const nodeId of [...config.primaryNodes, ...config.fallbackNodes]) {
        if (!this.circuitBreakers.has(nodeId)) {
          this.circuitBreakers.set(nodeId, {
            nodeId,
            state: 'closed',
            failureCount: 0,
            lastFailureTime: 0,
            nextRetryTime: 0,
            halfOpenCallCount: 0,
          });
        }
      }

      // Update routing table
      this.routingTable.set(tenantId, [...config.primaryNodes, ...config.fallbackNodes]);

      // Store configuration in Redis
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const configKey = `${keyPatterns.tenantSync.state(tenantId, 'failover', 'config')}`;
      await this.redisService.set(configKey, JSON.stringify(config));

      this.logger.debug(`Configured failover for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to configure failover for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Register a communication node
   */
  async registerNode(node: CommunicationNode): Promise<void> {
    try {
      this.nodes.set(node.id, node);

      // Initialize circuit breaker for the node
      if (!this.circuitBreakers.has(node.id)) {
        this.circuitBreakers.set(node.id, {
          nodeId: node.id,
          state: 'closed',
          failureCount: 0,
          lastFailureTime: 0,
          nextRetryTime: 0,
          halfOpenCallCount: 0,
        });
      }

      // Store node information in Redis
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const nodeKey = `${keyPatterns.globalSync.state('node', node.id)}`;
      await this.redisService.set(nodeKey, JSON.stringify(node));

      this.logger.debug(`Registered communication node ${node.id}`);
    } catch (error) {
      this.logger.error(`Failed to register node ${node.id}:`, error);
      throw error;
    }
  }

  /**
   * Deliver message with automatic failover
   */
  async deliverWithFailover(
    tenantId: string,
    message: SyncAwareA2AMessage,
    targetAgentId: string
  ): Promise<boolean> {
    const config = this.failoverConfigs.get(tenantId);
    if (!config) {
      throw new Error(`No failover configuration found for tenant ${tenantId}`);
    }

    const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
    const messageId = 'header' in message ? message.header.id : message.id;

    // Try primary nodes first
    for (const nodeId of config.primaryNodes) {
      try {
        const success = await this.deliverToNode(nodeId, message, targetAgentId);
        if (success) {
          await this.recordSuccessfulDelivery(nodeId, messageId);
          return true;
        }
      } catch (error) {
        await this.recordFailedDelivery(nodeId, messageId, error);
        this.logger.warn(`Primary node ${nodeId} failed for message ${messageId}:`, error);
      }
    }

    // Try fallback nodes
    for (const nodeId of config.fallbackNodes) {
      try {
        const success = await this.deliverToNode(nodeId, message, targetAgentId);
        if (success) {
          await this.recordSuccessfulDelivery(nodeId, messageId);
          await this.recordFailoverEvent('node_failure', nodeId, 'Fallback delivery successful');
          return true;
        }
      } catch (error) {
        await this.recordFailedDelivery(nodeId, messageId, error);
        this.logger.warn(`Fallback node ${nodeId} failed for message ${messageId}:`, error);
      }
    }

    // All nodes failed
    await this.handleCompleteFailure(tenantId, message, targetAgentId);
    return false;
  }

  /**
   * Check if a node is available for delivery
   */
  async isNodeAvailable(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    // Check node health status
    if (node.status === 'failed') {
      return false;
    }

    // Check circuit breaker state
    const circuitBreaker = this.circuitBreakers.get(nodeId);
    if (!circuitBreaker) {
      return true;
    }

    switch (circuitBreaker.state) {
      case 'closed':
        return true;
      case 'open':
        // Check if it's time to try again
        return Date.now() >= circuitBreaker.nextRetryTime;
      case 'half_open':
        // Allow limited calls in half-open state
        const config = this.getNodeFailoverConfig(nodeId);
        return (
          circuitBreaker.halfOpenCallCount < (config?.circuitBreakerConfig.halfOpenMaxCalls || 3)
        );
      default:
        return false;
    }
  }

  /**
   * Get healthy nodes for a tenant
   */
  async getHealthyNodes(tenantId: string): Promise<CommunicationNode[]> {
    const nodeIds = this.routingTable.get(tenantId) || [];
    const healthyNodes: CommunicationNode[] = [];

    for (const nodeId of nodeIds) {
      const isAvailable = await this.isNodeAvailable(nodeId);
      if (isAvailable) {
        const node = this.nodes.get(nodeId);
        if (node) {
          healthyNodes.push(node);
        }
      }
    }

    return healthyNodes.sort((a, b) => {
      // Sort by type (primary first) and then by load
      if (a.type !== b.type) {
        const typeOrder = { primary: 0, fallback: 1, emergency: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.currentLoad / a.capacity - b.currentLoad / b.capacity;
    });
  }

  /**
   * Trigger manual failover for a tenant
   */
  async triggerManualFailover(
    tenantId: string,
    fromNodeId: string,
    toNodeId: string
  ): Promise<void> {
    try {
      // Validate nodes exist
      const fromNode = this.nodes.get(fromNodeId);
      const toNode = this.nodes.get(toNodeId);

      if (!fromNode || !toNode) {
        throw new Error('Invalid node IDs for manual failover');
      }

      // Mark source node as degraded
      fromNode.status = 'degraded';
      await this.updateNodeStatus(fromNodeId, fromNode);

      // Update routing table to prioritize target node
      const nodeIds = this.routingTable.get(tenantId) || [];
      const updatedNodeIds = [toNodeId, ...nodeIds.filter((id) => id !== toNodeId)];
      this.routingTable.set(tenantId, updatedNodeIds);

      // Record failover event
      await this.recordFailoverEvent('node_failure', fromNodeId, `Manual failover to ${toNodeId}`);

      this.logger.log(
        `Manual failover triggered for tenant ${tenantId}: ${fromNodeId} -> ${toNodeId}`
      );
    } catch (error) {
      this.logger.error(`Failed to trigger manual failover:`, error);
      throw error;
    }
  }

  /**
   * Get failover statistics
   */
  getFailoverStats(): {
    totalNodes: number;
    healthyNodes: number;
    failedNodes: number;
    circuitBreakersOpen: number;
    recentFailoverEvents: FailoverEvent[];
  } {
    const totalNodes = this.nodes.size;
    const healthyNodes = Array.from(this.nodes.values()).filter(
      (n) => n.status === 'healthy'
    ).length;
    const failedNodes = Array.from(this.nodes.values()).filter((n) => n.status === 'failed').length;
    const circuitBreakersOpen = Array.from(this.circuitBreakers.values()).filter(
      (cb) => cb.state === 'open'
    ).length;
    const recentFailoverEvents = this.failoverEvents.slice(-10); // Last 10 events

    return {
      totalNodes,
      healthyNodes,
      failedNodes,
      circuitBreakersOpen,
      recentFailoverEvents,
    };
  }

  /**
   * Private helper methods
   */
  private async loadFailoverConfigurations(): Promise<void> {
    try {
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const configPattern = `${keyPatterns.patterns.tenantAll('*')}:failover:config`;

      const configKeys = await this.redisService.keys(configPattern);
      for (const key of configKeys) {
        try {
          const configData = await this.redisService.get(key);
          if (configData) {
            const config: MessageFailoverConfig = JSON.parse(configData);
            // Extract tenant ID from key
            const tenantId = key.split(':')[3]; // Assuming key format
            this.failoverConfigs.set(tenantId, config);
          }
        } catch (error) {
          this.logger.warn(`Failed to load failover config from key ${key}:`, error);
        }
      }

      this.logger.debug(`Loaded ${this.failoverConfigs.size} failover configurations`);
    } catch (error) {
      this.logger.error('Failed to load failover configurations:', error);
    }
  }

  private async initializeCommunicationNodes(): Promise<void> {
    try {
      const keyPatterns = this.redisConfig.getKeyspatterns();
      const nodePattern = `${keyPatterns.globalSync.state('node', '*')}`;

      const nodeKeys = await this.redisService.keys(nodePattern);
      for (const key of nodeKeys) {
        try {
          const nodeData = await this.redisService.get(key);
          if (nodeData) {
            const node: CommunicationNode = JSON.parse(nodeData);
            this.nodes.set(node.id, node);
          }
        } catch (error) {
          this.logger.warn(`Failed to load node from key ${key}:`, error);
        }
      }

      this.logger.debug(`Initialized ${this.nodes.size} communication nodes`);
    } catch (error) {
      this.logger.error('Failed to initialize communication nodes:', error);
    }
  }

  private async startHealthChecking(): Promise<void> {
    const healthCheckInterval = 30000; // 30 seconds

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.nodes.keys()).map((nodeId) =>
      this.checkNodeHealth(nodeId)
    );

    await Promise.allSettled(healthCheckPromises);
  }

  private async checkNodeHealth(nodeId: string): Promise<void> {
    try {
      const node = this.nodes.get(nodeId);
      if (!node) return;

      const startTime = Date.now();

      // Perform health check (this would be implemented based on your specific node types)
      const isHealthy = await this.performNodeHealthCheck(node);

      const responseTime = Date.now() - startTime;
      node.responseTime = responseTime;
      node.lastHealthCheck = Date.now();

      if (isHealthy) {
        if (node.status === 'failed' || node.status === 'degraded') {
          node.status = 'recovering';
          await this.recordFailoverEvent('node_recovery', nodeId, 'Node health check passed');
        } else if (node.status === 'recovering') {
          node.consecutiveSuccesses++;
          const config = this.getNodeFailoverConfig(nodeId);
          if (node.consecutiveSuccesses >= (config?.recoveryThreshold || 3)) {
            node.status = 'healthy';
            node.consecutiveFailures = 0;
            await this.updateCircuitBreakerState(nodeId, 'closed');
            await this.recordFailoverEvent('node_recovery', nodeId, 'Node fully recovered');
          }
        }
      } else {
        node.consecutiveFailures++;
        node.consecutiveSuccesses = 0;

        const config = this.getNodeFailoverConfig(nodeId);
        if (node.consecutiveFailures >= (config?.failoverThreshold || 3)) {
          node.status = 'failed';
          await this.updateCircuitBreakerState(nodeId, 'open');
          await this.recordFailoverEvent('node_failure', nodeId, 'Health check failed');
        } else {
          node.status = 'degraded';
        }
      }

      await this.updateNodeStatus(nodeId, node);
    } catch (error) {
      this.logger.warn(`Health check failed for node ${nodeId}:`, error);
    }
  }

  private async performNodeHealthCheck(node: CommunicationNode): Promise<boolean> {
    // This would be implemented based on your specific node types
    // For now, we'll simulate a health check
    try {
      // Simulate network call or service check
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

      // Simulate occasional failures
      return Math.random() > 0.1; // 90% success rate
    } catch (error) {
      return false;
    }
  }

  private async deliverToNode(
    nodeId: string,
    message: SyncAwareA2AMessage,
    targetAgentId: string
  ): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const circuitBreaker = this.circuitBreakers.get(nodeId);
    if (circuitBreaker && circuitBreaker.state === 'open') {
      throw new Error(`Circuit breaker open for node ${nodeId}`);
    }

    try {
      // Simulate message delivery to the node
      // This would be implemented based on your specific node communication protocol
      const success = await this.simulateNodeDelivery(node, message, targetAgentId);

      if (success && circuitBreaker) {
        if (circuitBreaker.state === 'half_open') {
          circuitBreaker.halfOpenCallCount++;
          const config = this.getNodeFailoverConfig(nodeId);
          if (
            circuitBreaker.halfOpenCallCount >= (config?.circuitBreakerConfig.halfOpenMaxCalls || 3)
          ) {
            await this.updateCircuitBreakerState(nodeId, 'closed');
          }
        }
      }

      return success;
    } catch (error) {
      if (circuitBreaker) {
        circuitBreaker.failureCount++;
        const config = this.getNodeFailoverConfig(nodeId);
        if (circuitBreaker.failureCount >= (config?.circuitBreakerConfig.failureThreshold || 5)) {
          await this.updateCircuitBreakerState(nodeId, 'open');
        }
      }
      throw error;
    }
  }

  private async simulateNodeDelivery(
    node: CommunicationNode,
    message: SyncAwareA2AMessage,
    targetAgentId: string
  ): Promise<boolean> {
    // Simulate delivery based on node capacity and current load
    if (node.currentLoad >= node.capacity) {
      throw new Error(`Node ${node.id} at capacity`);
    }

    // Simulate network delay and potential failures
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200));

    // Simulate occasional delivery failures
    if (Math.random() < 0.05) {
      // 5% failure rate
      throw new Error('Simulated delivery failure');
    }

    // Update node load
    node.currentLoad++;

    return true;
  }

  private async recordSuccessfulDelivery(nodeId: string, messageId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.consecutiveSuccesses++;
      node.consecutiveFailures = 0;
      if (node.currentLoad > 0) {
        node.currentLoad--;
      }
      await this.updateNodeStatus(nodeId, node);
    }
  }

  private async recordFailedDelivery(
    nodeId: string,
    messageId: string,
    error: Error
  ): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.consecutiveFailures++;
      node.consecutiveSuccesses = 0;
      if (node.currentLoad > 0) {
        node.currentLoad--;
      }
      await this.updateNodeStatus(nodeId, node);
    }

    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(nodeId);
    if (circuitBreaker) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();

      const config = this.getNodeFailoverConfig(nodeId);
      if (circuitBreaker.failureCount >= (config?.circuitBreakerConfig.failureThreshold || 5)) {
        await this.updateCircuitBreakerState(nodeId, 'open');
      }
    }
  }

  private async handleCompleteFailure(
    tenantId: string,
    message: SyncAwareA2AMessage,
    targetAgentId: string
  ): Promise<void> {
    const messageId = 'header' in message ? message.header.id : message.id;

    // Store in dead letter queue
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const deadLetterKey = keyPatterns.queues.deadLetter;

    await this.redisService.lpush(
      deadLetterKey,
      JSON.stringify({
        tenantId,
        messageId,
        targetAgentId,
        message,
        failureReason: 'All communication nodes failed',
        timestamp: Date.now(),
      })
    );

    await this.recordFailoverEvent(
      'node_failure',
      'all',
      'Complete delivery failure - all nodes unavailable'
    );

    this.logger.error(
      `Complete delivery failure for message ${messageId} to agent ${targetAgentId}`
    );
  }

  private async updateCircuitBreakerState(
    nodeId: string,
    state: 'closed' | 'open' | 'half_open'
  ): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(nodeId);
    if (!circuitBreaker) return;

    circuitBreaker.state = state;

    switch (state) {
      case 'open':
        const config = this.getNodeFailoverConfig(nodeId);
        circuitBreaker.nextRetryTime =
          Date.now() + (config?.circuitBreakerConfig.recoveryTimeout || 60000);
        await this.recordFailoverEvent(
          'circuit_breaker_open',
          nodeId,
          'Circuit breaker opened due to failures'
        );
        break;
      case 'half_open':
        circuitBreaker.halfOpenCallCount = 0;
        break;
      case 'closed':
        circuitBreaker.failureCount = 0;
        circuitBreaker.halfOpenCallCount = 0;
        await this.recordFailoverEvent(
          'circuit_breaker_close',
          nodeId,
          'Circuit breaker closed - node recovered'
        );
        break;
    }

    // Store circuit breaker state in Redis
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const cbKey = `${keyPatterns.globalSync.state('circuit_breaker', nodeId)}`;
    await this.redisService.set(cbKey, JSON.stringify(circuitBreaker));
  }

  private async updateNodeStatus(nodeId: string, node: CommunicationNode): Promise<void> {
    this.nodes.set(nodeId, node);

    // Store in Redis
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const nodeKey = `${keyPatterns.globalSync.state('node', nodeId)}`;
    await this.redisService.set(nodeKey, JSON.stringify(node));
  }

  private async recordFailoverEvent(
    type: FailoverEvent['type'],
    nodeId: string,
    reason: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const event: FailoverEvent = {
      id: `failover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      nodeId,
      timestamp: Date.now(),
      reason,
      metadata,
    };

    this.failoverEvents.push(event);

    // Keep only last 100 events in memory
    if (this.failoverEvents.length > 100) {
      this.failoverEvents = this.failoverEvents.slice(-100);
    }

    // Store in Redis
    const keyPatterns = this.redisConfig.getKeyspatterns();
    const eventKey = `${keyPatterns.globalSync.state('failover_event', event.id)}`;
    await this.redisService.set(eventKey, JSON.stringify(event), 'EX', 86400); // 24 hour TTL

    // Publish event
    await this.redisService.publish(keyPatterns.channels.health, JSON.stringify(event));
  }

  private getNodeFailoverConfig(nodeId: string): MessageFailoverConfig | null {
    for (const config of this.failoverConfigs.values()) {
      if (config.primaryNodes.includes(nodeId) || config.fallbackNodes.includes(nodeId)) {
        return config;
      }
    }
    return null;
  }

  private startFailoverEventProcessing(): void {
    // Subscribe to failover events from other instances
    const keyPatterns = this.redisConfig.getKeyspatterns();

    this.redisService.psubscribe(keyPatterns.channels.health, async (message) => {
      try {
        const event: FailoverEvent = JSON.parse(message.message);
        await this.handleFailoverEvent(event);
      } catch (error) {
        this.logger.warn('Failed to handle failover event:', error);
      }
    });
  }

  private async handleFailoverEvent(event: FailoverEvent): Promise<void> {
    // Process failover events from other instances
    switch (event.type) {
      case 'node_failure':
        await this.handleRemoteNodeFailure(event);
        break;
      case 'node_recovery':
        await this.handleRemoteNodeRecovery(event);
        break;
      case 'circuit_breaker_open':
      case 'circuit_breaker_close':
        await this.syncCircuitBreakerState(event);
        break;
    }
  }

  private async handleRemoteNodeFailure(event: FailoverEvent): Promise<void> {
    const node = this.nodes.get(event.nodeId);
    if (node && node.status !== 'failed') {
      node.status = 'failed';
      await this.updateNodeStatus(event.nodeId, node);
      this.logger.warn(`Remote node failure detected: ${event.nodeId}`);
    }
  }

  private async handleRemoteNodeRecovery(event: FailoverEvent): Promise<void> {
    const node = this.nodes.get(event.nodeId);
    if (node && node.status === 'failed') {
      node.status = 'recovering';
      await this.updateNodeStatus(event.nodeId, node);
      this.logger.info(`Remote node recovery detected: ${event.nodeId}`);
    }
  }

  private async syncCircuitBreakerState(event: FailoverEvent): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(event.nodeId);
    if (circuitBreaker) {
      const newState = event.type === 'circuit_breaker_open' ? 'open' : 'closed';
      if (circuitBreaker.state !== newState) {
        await this.updateCircuitBreakerState(event.nodeId, newState);
        this.logger.debug(`Synced circuit breaker state for ${event.nodeId}: ${newState}`);
      }
    }
  }

  private async cleanup(): Promise<void> {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear data structures
    this.nodes.clear();
    this.failoverConfigs.clear();
    this.circuitBreakers.clear();
    this.routingTable.clear();
    this.failoverEvents = [];

    // Unsubscribe from Redis channels
    const keyPatterns = this.redisConfig.getKeyspatterns();
    await this.redisService.punsubscribe(keyPatterns.channels.health);
  }
}
