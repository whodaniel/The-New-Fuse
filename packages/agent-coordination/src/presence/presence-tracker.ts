import { Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { AgentStatus } from '@the-new-fuse/a2a-core';
import { AgentPresence, CoordinationChannel } from '../types/coordination.types';
import { MessageSerializer } from '../serializers/message-serializer';

/**
 * Agent presence tracker with heartbeat system
 */
export class PresenceTracker {
  private readonly logger = new Logger(PresenceTracker.name);
  private readonly keyPrefix: string;
  private readonly heartbeatInterval: number;
  private readonly heartbeatTimeout: number;
  private readonly serializer: MessageSerializer;
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private monitorInterval?: NodeJS.Timeout;

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly config: {
      keyPrefix?: string;
      heartbeatInterval?: number;
      heartbeatTimeout?: number;
    },
    serializer: MessageSerializer
  ) {
    this.keyPrefix = config.keyPrefix || 'agent-coord:';
    this.heartbeatInterval = config.heartbeatInterval || 30000; // 30 seconds
    this.heartbeatTimeout = config.heartbeatTimeout || 90000; // 90 seconds (3x heartbeat)
    this.serializer = serializer;
  }

  /**
   * Register agent presence
   */
  async registerAgent(agentId: string, metadata?: Record<string, any>): Promise<void> {
    const presence: AgentPresence = {
      agentId,
      status: AgentStatus.ONLINE,
      lastSeen: Date.now(),
      lastHeartbeat: Date.now(),
      metadata,
    };

    await this.updatePresence(presence);
    this.startHeartbeat(agentId);
    
    this.logger.log(`Agent registered: ${agentId}`);
  }

  /**
   * Unregister agent presence
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.stopHeartbeat(agentId);
    
    const presence = await this.getPresence(agentId);
    if (presence) {
      presence.status = AgentStatus.OFFLINE;
      presence.lastSeen = Date.now();
      await this.updatePresence(presence);
    }

    await this.redisService.srem(`${this.keyPrefix}agents:active`, agentId);
    
    // Publish offline event
    await this.publishPresenceEvent(agentId, AgentStatus.OFFLINE);
    
    this.logger.log(`Agent unregistered: ${agentId}`);
  }

  /**
   * Update agent status
   */
  async updateStatus(agentId: string, status: AgentStatus): Promise<void> {
    const presence = await this.getPresence(agentId);
    if (presence) {
      presence.status = status;
      presence.lastSeen = Date.now();
      await this.updatePresence(presence);
      await this.publishPresenceEvent(agentId, status);
    }
  }

  /**
   * Get agent presence
   */
  async getPresence(agentId: string): Promise<AgentPresence | null> {
    const key = `${this.keyPrefix}presence:${agentId}`;
    const data = await this.redisService.get(key);
    
    if (!data) return null;
    
    try {
      return this.serializer.deserialize<AgentPresence>(data);
    } catch (error) {
      this.logger.error(`Failed to deserialize presence for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get all active agents
   */
  async getActiveAgents(): Promise<AgentPresence[]> {
    const agentIds = await this.redisService.smembers(`${this.keyPrefix}agents:active`);
    const presences: AgentPresence[] = [];

    for (const agentId of agentIds) {
      const presence = await this.getPresence(agentId);
      if (presence && this.isAgentAlive(presence)) {
        presences.push(presence);
      }
    }

    return presences;
  }

  /**
   * Check if agent is online
   */
  async isOnline(agentId: string): Promise<boolean> {
    const presence = await this.getPresence(agentId);
    return presence ? this.isAgentAlive(presence) : false;
  }

  /**
   * Start monitoring for stale agents
   */
  startMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      await this.checkStaleAgents();
    }, this.heartbeatInterval);

    this.logger.log('Presence monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }

    // Clear all heartbeat timers
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();

    this.logger.log('Presence monitoring stopped');
  }

  /**
   * Update agent presence
   */
  private async updatePresence(presence: AgentPresence): Promise<void> {
    const key = `${this.keyPrefix}presence:${presence.agentId}`;
    const ttl = Math.ceil(this.heartbeatTimeout / 1000);
    
    await this.redisService.set(
      key,
      this.serializer.serialize(presence),
      ttl
    );

    // Add to active agents set
    if (presence.status === AgentStatus.ONLINE || presence.status === AgentStatus.BUSY) {
      await this.redisService.sadd(`${this.keyPrefix}agents:active`, presence.agentId);
    }
  }

  /**
   * Start heartbeat for agent
   */
  private startHeartbeat(agentId: string): void {
    // Clear existing heartbeat if any
    this.stopHeartbeat(agentId);

    const timer = setInterval(async () => {
      try {
        const presence = await this.getPresence(agentId);
        if (presence) {
          presence.lastHeartbeat = Date.now();
          presence.lastSeen = Date.now();
          await this.updatePresence(presence);
        }
      } catch (error) {
        this.logger.error(`Heartbeat failed for ${agentId}:`, error);
      }
    }, this.heartbeatInterval);

    this.heartbeatTimers.set(agentId, timer);
  }

  /**
   * Stop heartbeat for agent
   */
  private stopHeartbeat(agentId: string): void {
    const timer = this.heartbeatTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(agentId);
    }
  }

  /**
   * Check if agent is alive based on heartbeat
   */
  private isAgentAlive(presence: AgentPresence): boolean {
    const now = Date.now();
    const timeSinceHeartbeat = now - presence.lastHeartbeat;
    return timeSinceHeartbeat < this.heartbeatTimeout;
  }

  /**
   * Check for stale agents and mark them offline
   */
  private async checkStaleAgents(): Promise<void> {
    const activeAgentIds = await this.redisService.smembers(`${this.keyPrefix}agents:active`);

    for (const agentId of activeAgentIds) {
      const presence = await this.getPresence(agentId);
      
      if (!presence || !this.isAgentAlive(presence)) {
        // Mark as offline
        if (presence) {
          presence.status = AgentStatus.OFFLINE;
          presence.lastSeen = Date.now();
          await this.updatePresence(presence);
        }
        
        await this.redisService.srem(`${this.keyPrefix}agents:active`, agentId);
        await this.publishPresenceEvent(agentId, AgentStatus.OFFLINE);
        
        this.logger.warn(`Agent marked offline due to stale heartbeat: ${agentId}`);
      }
    }
  }

  /**
   * Publish presence event
   */
  private async publishPresenceEvent(agentId: string, status: AgentStatus): Promise<void> {
    const event = {
      type: 'presence:changed',
      agentId,
      status,
      timestamp: Date.now(),
    };

    await this.redisService.publish(
      `${this.keyPrefix}${CoordinationChannel.PRESENCE}`,
      this.serializer.serialize(event)
    );
  }
}
