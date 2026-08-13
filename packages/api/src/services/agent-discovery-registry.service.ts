/**
 * Agent Discovery Registry Service
 *
 * Redis-based service for managing live agent discovery, heartbeats,
 * and dynamic capability registration.
 */

import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
import {
  AgentHealthMetrics,
  AgentHeartbeat,
  AgentRegistration,
  AgentStatus,
  DiscoveredAgent,
  DiscoveryEvent,
  DiscoveryEventPayload,
  DiscoveryQuery,
  DiscoveryQueryResult,
  LoadBalancingRecommendation,
} from '../types/agent-discovery.types.js';

export interface DiscoveryRegistryOptions {
  /** Redis connection options */
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };

  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatInterval?: number;

  /** Heartbeat timeout in milliseconds (default: 60000) */
  heartbeatTimeout?: number;

  /** Whether to enable pub/sub for real-time events */
  enablePubSub?: boolean;

  /** Key prefix for Redis keys */
  keyPrefix?: string;
}

export class AgentDiscoveryRegistry extends EventEmitter {
  private redisService: UnifiedRedisService;
  private options: Required<DiscoveryRegistryOptions>;
  private cleanupInterval?: NodeJS.Timeout;

  // Redis key patterns
  private readonly AGENT_KEY_PREFIX: string;
  private readonly AGENT_HEARTBEAT_PREFIX: string;
  private readonly AGENT_METRICS_PREFIX: string;
  private readonly AGENT_SET_KEY: string;
  private readonly AGENT_CAPABILITY_INDEX: string;
  private readonly PUBSUB_CHANNEL: string;

  constructor(redisService: UnifiedRedisService, options: DiscoveryRegistryOptions = {}) {
    super();

    this.redisService = redisService;
    this.options = {
      redis: options.redis || {},
      heartbeatInterval: options.heartbeatInterval || 30000,
      heartbeatTimeout: options.heartbeatTimeout || 60000,
      enablePubSub: options.enablePubSub ?? true,
      keyPrefix: options.keyPrefix || 'agent:discovery',
    };

    // Initialize Redis keys
    this.AGENT_KEY_PREFIX = `${this.options.keyPrefix}:agent:`;
    this.AGENT_HEARTBEAT_PREFIX = `${this.options.keyPrefix}:heartbeat:`;
    this.AGENT_METRICS_PREFIX = `${this.options.keyPrefix}:metrics:`;
    this.AGENT_SET_KEY = `${this.options.keyPrefix}:agents`;
    this.AGENT_CAPABILITY_INDEX = `${this.options.keyPrefix}:capabilities`;
    this.PUBSUB_CHANNEL = `${this.options.keyPrefix}:events`;

    // Initialize pub/sub if enabled
    if (this.options.enablePubSub) {
      this.initializePubSub();
    }

    // Start cleanup job
    this.startCleanupJob();
  }

  /**
   * Initialize pub/sub for real-time events
   */
  private initializePubSub(): void {
    this.redisService.subscribe(this.PUBSUB_CHANNEL, (message) => {
      try {
        const payload: DiscoveryEventPayload =
          typeof message.message === 'string'
            ? JSON.parse(message.message)
            : (message.message as any);
        this.emit(payload.event, payload);
      } catch (error) {
        console.error('Failed to parse pubsub message:', error);
      }
    });
  }

  /**
   * Register a new agent or update existing registration
   */
  async registerAgent(registration: AgentRegistration): Promise<void> {
    const agentKey = this.AGENT_KEY_PREFIX + registration.agentId;
    const heartbeatKey = this.AGENT_HEARTBEAT_PREFIX + registration.agentId;

    // Store agent registration
    await this.redisService.set(agentKey, JSON.stringify(registration));

    // Add to agent set
    await this.redisService.sadd(this.AGENT_SET_KEY, registration.agentId);

    // Index capabilities for fast searching
    await this.indexCapabilities(registration);

    // Initialize heartbeat with current timestamp
    await this.redisService.set(
      heartbeatKey,
      Date.now().toString(),
      Math.floor(this.options.heartbeatTimeout / 1000)
    );

    // Publish registration event
    await this.publishEvent({
      event: DiscoveryEvent.AGENT_REGISTERED,
      agentId: registration.agentId,
      timestamp: new Date(),
      data: registration,
    });

    this.emit(DiscoveryEvent.AGENT_REGISTERED, registration);
  }

  /**
   * Index agent capabilities for fast searching
   */
  private async indexCapabilities(registration: AgentRegistration): Promise<void> {
    for (const capability of registration.capabilities) {
      // Index by capability name
      await this.redisService.sadd(
        `${this.AGENT_CAPABILITY_INDEX}:${capability.name}`,
        registration.agentId
      );

      // Index by languages
      if (capability.languages) {
        for (const lang of capability.languages) {
          await this.redisService.sadd(
            `${this.AGENT_CAPABILITY_INDEX}:lang:${lang.toLowerCase()}`,
            registration.agentId
          );
        }
      }

      // Index by frameworks
      if (capability.frameworks) {
        for (const framework of capability.frameworks) {
          await this.redisService.sadd(
            `${this.AGENT_CAPABILITY_INDEX}:framework:${framework.toLowerCase()}`,
            registration.agentId
          );
        }
      }
    }

    // Index by groups
    if (registration.groups) {
      for (const group of registration.groups) {
        await this.redisService.sadd(
          `${this.AGENT_CAPABILITY_INDEX}:group:${group.toLowerCase()}`,
          registration.agentId
        );
      }
    }

    // Index by type
    if (registration.type) {
      await this.redisService.sadd(
        `${this.AGENT_CAPABILITY_INDEX}:type:${registration.type.toLowerCase()}`,
        registration.agentId
      );
    }
  }

  /**
   * Update agent heartbeat
   */
  async heartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    const heartbeatKey = this.AGENT_HEARTBEAT_PREFIX + heartbeat.agentId;
    const metricsKey = this.AGENT_METRICS_PREFIX + heartbeat.agentId;

    const ttl = Math.floor(this.options.heartbeatTimeout / 1000);

    // Update heartbeat timestamp
    await this.redisService.set(heartbeatKey, Date.now().toString(), ttl);

    // Update metrics
    await this.redisService.set(metricsKey, JSON.stringify(heartbeat.metrics), ttl);

    // Store status
    await this.redisService.set(
      `${this.AGENT_KEY_PREFIX}${heartbeat.agentId}:status`,
      heartbeat.status,
      ttl
    );

    // Publish heartbeat event
    await this.publishEvent({
      event: DiscoveryEvent.AGENT_HEARTBEAT,
      agentId: heartbeat.agentId,
      timestamp: new Date(),
      data: heartbeat,
    });
  }

  /**
   * Deregister an agent
   */
  async deregisterAgent(agentId: string): Promise<void> {
    const agentKey = this.AGENT_KEY_PREFIX + agentId;
    const heartbeatKey = this.AGENT_HEARTBEAT_PREFIX + agentId;
    const metricsKey = this.AGENT_METRICS_PREFIX + agentId;

    // Get agent data before deletion
    const agentData = await this.redisService.get(agentKey);
    const registration: AgentRegistration | null = agentData ? JSON.parse(agentData) : null;

    // Remove from capability indexes
    if (registration) {
      await this.removeCapabilityIndexes(registration);
    }

    // Remove agent data
    await this.redisService.del(agentKey);
    await this.redisService.del(heartbeatKey);
    await this.redisService.del(metricsKey);
    await this.redisService.del(`${agentKey}:status`);

    // Remove from agent set
    await this.redisService.srem(this.AGENT_SET_KEY, agentId);

    // Publish deregistration event
    await this.publishEvent({
      event: DiscoveryEvent.AGENT_DEREGISTERED,
      agentId,
      timestamp: new Date(),
      data: { agentId },
    });

    this.emit(DiscoveryEvent.AGENT_DEREGISTERED, { agentId });
  }

  /**
   * Remove agent from capability indexes
   */
  private async removeCapabilityIndexes(registration: AgentRegistration): Promise<void> {
    for (const capability of registration.capabilities) {
      await this.redisService.srem(
        `${this.AGENT_CAPABILITY_INDEX}:${capability.name}`,
        registration.agentId
      );

      if (capability.languages) {
        for (const lang of capability.languages) {
          await this.redisService.srem(
            `${this.AGENT_CAPABILITY_INDEX}:lang:${lang.toLowerCase()}`,
            registration.agentId
          );
        }
      }

      if (capability.frameworks) {
        for (const framework of capability.frameworks) {
          await this.redisService.srem(
            `${this.AGENT_CAPABILITY_INDEX}:framework:${framework.toLowerCase()}`,
            registration.agentId
          );
        }
      }
    }

    if (registration.groups) {
      for (const group of registration.groups) {
        await this.redisService.srem(
          `${this.AGENT_CAPABILITY_INDEX}:group:${group.toLowerCase()}`,
          registration.agentId
        );
      }
    }

    if (registration.type) {
      await this.redisService.srem(
        `${this.AGENT_CAPABILITY_INDEX}:type:${registration.type.toLowerCase()}`,
        registration.agentId
      );
    }
  }

  /**
   * Query and discover agents based on criteria
   */
  async discoverAgents(query: DiscoveryQuery = {}): Promise<DiscoveryQueryResult> {
    const startTime = Date.now();
    let agentIds: Set<string> = new Set();

    // Get candidate agent IDs based on query
    if (query.capability) {
      const capabilityAgents = await this.redisService.smembers(
        `${this.AGENT_CAPABILITY_INDEX}:${query.capability}`
      );
      agentIds = new Set(capabilityAgents);
    } else {
      // Get all agents
      const allAgents = await this.redisService.smembers(this.AGENT_SET_KEY);
      agentIds = new Set(allAgents);
    }

    // Apply filters
    if (query.languages && query.languages.length > 0) {
      agentIds = await this.intersectWithLanguages(agentIds, query.languages);
    }

    if (query.frameworks && query.frameworks.length > 0) {
      agentIds = await this.intersectWithFrameworks(agentIds, query.frameworks);
    }

    if (query.groups && query.groups.length > 0) {
      agentIds = await this.intersectWithGroups(agentIds, query.groups);
    }

    if (query.types && query.types.length > 0) {
      agentIds = await this.intersectWithTypes(agentIds, query.types);
    }

    // Load full agent data and apply additional filters
    const agents: DiscoveredAgent[] = [];
    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      if (agent && this.matchesFilters(agent, query)) {
        agents.push(agent);
      }
    }

    // Calculate relevance scores if semantic search is enabled
    if (query.semanticSearch && query.capability) {
      this.calculateRelevanceScores(agents, query.capability);
    }

    // Sort agents
    this.sortAgents(agents, query);

    // Apply limit
    const total = agents.length;
    const limitedAgents = query.limit ? agents.slice(0, query.limit) : agents;

    // Generate load balancing recommendations
    const recommendations = this.generateLoadBalancingRecommendations(limitedAgents);

    const queryTime = Date.now() - startTime;

    return {
      agents: limitedAgents,
      total,
      queryTime,
      recommendations,
    };
  }

  /**
   * Get full agent details
   */
  private async getAgent(agentId: string): Promise<DiscoveredAgent | null> {
    const agentKey = this.AGENT_KEY_PREFIX + agentId;
    const heartbeatKey = this.AGENT_HEARTBEAT_PREFIX + agentId;
    const metricsKey = this.AGENT_METRICS_PREFIX + agentId;

    const [agentData, heartbeatData, metricsData, statusData] = await Promise.all([
      this.redisService.get(agentKey),
      this.redisService.get(heartbeatKey),
      this.redisService.get(metricsKey),
      this.redisService.get(`${agentKey}:status`),
    ]);

    if (!agentData) {
      return null;
    }

    const registration: AgentRegistration = JSON.parse(agentData);
    const lastHeartbeat = heartbeatData ? new Date(parseInt(heartbeatData, 10)) : new Date(0);
    const metrics: AgentHealthMetrics = metricsData
      ? JSON.parse(metricsData)
      : this.getDefaultMetrics();
    const status: AgentStatus = (statusData as AgentStatus) || AgentStatus.OFFLINE;

    // Calculate load based on active tasks and resource usage
    const load = this.calculateLoad(metrics);

    return {
      registration,
      status,
      load,
      metrics,
      lastHeartbeat,
      firstSeen: new Date(), // Would be stored separately in production
    };
  }

  /**
   * Calculate agent load
   */
  private calculateLoad(metrics: AgentHealthMetrics): number {
    const cpuWeight = 0.4;
    const memoryWeight = 0.3;
    const taskWeight = 0.3;

    const cpuLoad = metrics.cpuUsage / 100;
    const memoryLoad = metrics.memoryUsage / 100;
    const taskLoad = Math.min(metrics.activeTasks / 10, 1); // Assume max 10 concurrent tasks

    return cpuWeight * cpuLoad + memoryWeight * memoryLoad + taskWeight * taskLoad;
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): AgentHealthMetrics {
    return {
      isHealthy: false,
      uptime: 0,
      successRate: 0,
      avgResponseTime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      activeTasks: 0,
      totalTasks: 0,
      failedTasks: 0,
    };
  }

  /**
   * Intersect agent IDs with language filter
   */
  private async intersectWithLanguages(
    agentIds: Set<string>,
    languages: string[]
  ): Promise<Set<string>> {
    const sets = languages.map(
      (lang) => `${this.AGENT_CAPABILITY_INDEX}:lang:${lang.toLowerCase()}`
    );
    const intersection = await this.redisService.sinter(...sets);
    return new Set(intersection.filter((id) => agentIds.has(id)));
  }

  /**
   * Intersect agent IDs with framework filter
   */
  private async intersectWithFrameworks(
    agentIds: Set<string>,
    frameworks: string[]
  ): Promise<Set<string>> {
    const sets = frameworks.map(
      (fw) => `${this.AGENT_CAPABILITY_INDEX}:framework:${fw.toLowerCase()}`
    );
    const intersection = await this.redisService.sinter(...sets);
    return new Set(intersection.filter((id) => agentIds.has(id)));
  }

  /**
   * Intersect agent IDs with group filter
   */
  private async intersectWithGroups(agentIds: Set<string>, groups: string[]): Promise<Set<string>> {
    const sets = groups.map(
      (group) => `${this.AGENT_CAPABILITY_INDEX}:group:${group.toLowerCase()}`
    );
    const intersection = await this.redisService.sinter(...sets);
    return new Set(intersection.filter((id) => agentIds.has(id)));
  }

  /**
   * Intersect agent IDs with type filter
   */
  private async intersectWithTypes(agentIds: Set<string>, types: string[]): Promise<Set<string>> {
    const sets = types.map((type) => `${this.AGENT_CAPABILITY_INDEX}:type:${type.toLowerCase()}`);
    const intersection = await this.redisService.sinter(...sets);
    return new Set(intersection.filter((id) => agentIds.has(id)));
  }

  /**
   * Check if agent matches additional filters
   */
  private matchesFilters(agent: DiscoveredAgent, query: DiscoveryQuery): boolean {
    if (query.status && !query.status.includes(agent.status)) {
      return false;
    }

    if (query.maxCpuUsage !== undefined && agent.metrics.cpuUsage > query.maxCpuUsage) {
      return false;
    }

    if (query.maxMemoryUsage !== undefined && agent.metrics.memoryUsage > query.maxMemoryUsage) {
      return false;
    }

    if (query.maxLoad !== undefined && agent.load > query.maxLoad) {
      return false;
    }

    if (query.minSuccessRate !== undefined && agent.metrics.successRate < query.minSuccessRate) {
      return false;
    }

    if (query.minConfidence !== undefined) {
      const hasCapabilityWithMinConfidence = agent.registration.capabilities.some(
        (cap) => cap.confidence >= query.minConfidence!
      );
      if (!hasCapabilityWithMinConfidence) {
        return false;
      }
    }

    if (query.maxCost !== undefined) {
      const hasAffordableCapability = agent.registration.capabilities.some(
        (cap) => !cap.pricing?.perInvocation || cap.pricing.perInvocation <= query.maxCost!
      );
      if (!hasAffordableCapability) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate relevance scores for semantic search
   */
  private calculateRelevanceScores(agents: DiscoveredAgent[], searchTerm: string): void {
    const searchLower = searchTerm.toLowerCase();

    for (const agent of agents) {
      let score = 0;

      for (const capability of agent.registration.capabilities) {
        // Exact match
        if (capability.name.toLowerCase() === searchLower) {
          score += 1.0;
        }
        // Contains match
        else if (capability.name.toLowerCase().includes(searchLower)) {
          score += 0.7;
        }
        // Description match
        else if (capability.description.toLowerCase().includes(searchLower)) {
          score += 0.5;
        }

        // Boost by confidence
        score *= capability.confidence;
      }

      agent.score = Math.min(score, 1);
    }
  }

  /**
   * Sort agents based on query parameters
   */
  private sortAgents(agents: DiscoveredAgent[], query: DiscoveryQuery): void {
    const sortBy = query.sortBy || 'relevance';
    const direction = query.sortDirection === 'asc' ? 1 : -1;

    agents.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = (b.score || 0) - (a.score || 0);
          break;
        case 'load':
          comparison = a.load - b.load;
          break;
        case 'successRate':
          comparison = b.metrics.successRate - a.metrics.successRate;
          break;
        case 'responseTime':
          comparison = a.metrics.avgResponseTime - b.metrics.avgResponseTime;
          break;
        case 'uptime':
          comparison = b.metrics.uptime - a.metrics.uptime;
          break;
      }

      return comparison * direction;
    });
  }

  /**
   * Generate load balancing recommendations
   */
  private generateLoadBalancingRecommendations(
    agents: DiscoveredAgent[]
  ): LoadBalancingRecommendation[] {
    const recommendations: LoadBalancingRecommendation[] = [];

    // Find agents with low load and high success rate
    const availableAgents = agents
      .filter((agent) => agent.status === AgentStatus.ONLINE || agent.status === AgentStatus.IDLE)
      .filter((agent) => agent.load < 0.7 && agent.metrics.isHealthy)
      .sort((a, b) => {
        // Score based on load and success rate
        const scoreA = (1 - a.load) * a.metrics.successRate;
        const scoreB = (1 - b.load) * b.metrics.successRate;
        return scoreB - scoreA;
      });

    for (const agent of availableAgents.slice(0, 3)) {
      const score = (1 - agent.load) * agent.metrics.successRate;
      const estimatedWaitTime = agent.metrics.avgResponseTime * (1 + agent.load);

      recommendations.push({
        agentId: agent.registration.agentId,
        score,
        reason: `Low load (${(agent.load * 100).toFixed(1)}%), high success rate (${(agent.metrics.successRate * 100).toFixed(1)}%)`,
        estimatedWaitTime,
      });
    }

    return recommendations;
  }

  /**
   * Start cleanup job to remove stale agents
   */
  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStaleAgents();
    }, this.options.heartbeatInterval);
  }

  /**
   * Remove agents that haven't sent heartbeat within timeout period
   */
  private async cleanupStaleAgents(): Promise<void> {
    const agentIds = await this.redisService.smembers(this.AGENT_SET_KEY);
    const now = Date.now();
    const timeout = this.options.heartbeatTimeout;

    for (const agentId of agentIds) {
      const heartbeatKey = this.AGENT_HEARTBEAT_PREFIX + agentId;
      const lastHeartbeat = await this.redisService.get(heartbeatKey);

      if (!lastHeartbeat || now - parseInt(lastHeartbeat, 10) > timeout) {
        await this.deregisterAgent(agentId);
      }
    }
  }

  /**
   * Publish event to pub/sub channel
   */
  private async publishEvent(payload: DiscoveryEventPayload): Promise<void> {
    if (this.options.enablePubSub) {
      await this.redisService.publish(this.PUBSUB_CHANNEL, JSON.stringify(payload));
    }
  }

  /**
   * Get all registered agents
   */
  async getAllAgents(): Promise<DiscoveredAgent[]> {
    const agentIds = await this.redisService.smembers(this.AGENT_SET_KEY);
    const agents: DiscoveredAgent[] = [];

    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<DiscoveredAgent | null> {
    return this.getAgent(agentId);
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
