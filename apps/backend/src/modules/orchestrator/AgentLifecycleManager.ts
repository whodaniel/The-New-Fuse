import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { AgentInbox } from '../../shared/agent-inbox';
import { HeartbeatMonitoringService } from './orchestrator.service';

export interface AgentRegistration {
  agentId: string;
  role: string;
  capabilities: string[];
  expectedResponseTime?: number;
  metadata?: Record<string, unknown>;
}

export interface AgentSpawnConfig {
  role: string;
  capabilities: string[];
  autoStart?: boolean;
  maxRetries?: number;
}

/**
 * AgentLifecycleManager
 *
 * Manages the complete lifecycle of agents:
 * - Registration & onboarding
 * - Inbox creation
 * - Heartbeat monitoring
 * - Health checks
 * - Auto-recovery from failures
 * - Graceful shutdown
 *
 * Integrates with:
 * - HeartbeatMonitoringService
 * - AgentInbox
 * - TNFRouter (for capability-based routing)
 */
@Injectable()
export class AgentLifecycleManager {
  private readonly logger = new Logger(AgentLifecycleManager.name);
  private readonly redis: Redis;
  private readonly heartbeatService: HeartbeatMonitoringService;
  private readonly eventEmitter: EventEmitter2;
  private readonly agents: Map<string, AgentRegistration> = new Map();

  constructor(
    redis: Redis,
    heartbeatService: HeartbeatMonitoringService,
    eventEmitter: EventEmitter2
  ) {
    this.redis = redis;
    this.heartbeatService = heartbeatService;
    this.eventEmitter = eventEmitter;

    // Listen for agent failures
    this.eventEmitter.on('agent.stagnation', (alert: any) => {
      this.handleAgentFailure(alert.agentId, alert);
    });

    this.eventEmitter.on('agent.emergency', (alert: any) => {
      this.handleAgentEmergency(alert.agentId, alert);
    });
  }

  // ============ AGENT REGISTRATION ============

  /**
   * Register a new agent in the system
   */
  async registerAgent(registration: AgentRegistration): Promise<void> {
    const { agentId, role, capabilities, expectedResponseTime, metadata } = registration;
    const identity = (metadata?.identity as Record<string, any>) || {
      longTermId: `agent-${agentId}`,
      ephemeralId: `inst-${Date.now()}`,
      protocolVersion: 'tnf-1',
    };
    const tenancy = (metadata?.tenancy as Record<string, any>) || {
      tenantId: metadata?.tenantId,
      organizationId: metadata?.organizationId,
      agencyId: metadata?.agencyId,
    };

    this.logger.log(`Registering agent: ${agentId} (role: ${role})`);

    // 1. Store agent registration
    this.agents.set(agentId, registration);
    await this.redis.hset(`agent:${agentId}:registration`, {
      agentId,
      role,
      capabilities: JSON.stringify(capabilities),
      registeredAt: new Date().toISOString(),
      metadata: JSON.stringify({
        ...(metadata || {}),
        identity,
        tenancy,
      }),
    });

    // 2. Store capabilities for routing
    await this.redis.sadd(`agent:${agentId}:capabilities`, ...capabilities);

    // 3. Register with heartbeat monitoring
    this.heartbeatService.registerAgent(agentId, expectedResponseTime);

    // 4. Create inbox
    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
    await inbox.create();

    // 5. Send onboarding task to inbox
    await inbox.receiveTask({
      id: `onboard-${agentId}`,
      type: 'onboarding',
      priority: 10,
      data: {
        startFile: '.agent/skills/library-of-living-knowledge/SKILL.md',
        learningPath: 'progressive',
        role,
        capabilities,
      },
      metadata: {
        isOnboarding: true,
        createdAt: new Date(),
      },
    });

    // 6. Emit registration event
    this.eventEmitter.emit('agent.lifecycle.registered', {
      agentId,
      role,
      capabilities,
      timestamp: new Date(),
    });

    this.logger.log(`✅ Agent ${agentId} registered successfully`);
  }

  /**
   * Spawn a new agent instance
   */
  async spawnAgent(config: AgentSpawnConfig): Promise<string> {
    const agentId = `agent-${config.role}-${Date.now()}`;

    this.logger.log(`Spawning new agent: ${agentId}`);

    await this.registerAgent({
      agentId,
      role: config.role,
      capabilities: config.capabilities,
      expectedResponseTime: 60000,
      metadata: {
        spawnedAt: new Date(),
        autoStart: config.autoStart ?? true,
      },
    });

    if (config.autoStart !== false) {
      // Send "start processing" task
      const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
      await inbox.receiveTask({
        id: `start-${agentId}`,
        type: 'start_processing',
        priority: 9,
        data: {
          message: 'Begin processing inbox tasks',
        },
      });
    }

    return agentId;
  }

  // ============ HEALTH MONITORING ============

  /**
   * Check health of all agents
   */
  async checkAllAgentsHealth(): Promise<{
    healthy: string[];
    stalled: string[];
    failed: string[];
  }> {
    const metrics = this.heartbeatService.getHealthMetrics();

    const healthy: string[] = [];
    const stalled: string[] = [];
    const failed: string[] = [];

    for (const [agentId, registration] of this.agents) {
      const status = this.heartbeatService.getAgentStatus(agentId);

      if (!status) {
        failed.push(agentId);
        continue;
      }

      switch (status.status) {
        case 'active':
        case 'idle':
          healthy.push(agentId);
          break;
        case 'stalled':
          stalled.push(agentId);
          break;
        case 'failed':
          failed.push(agentId);
          break;
      }
    }

    return { healthy, stalled, failed };
  }

  /**
   * Monitor agent inbox health
   */
  async monitorInboxHealth(agentId: string): Promise<void> {
    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
    const stats = await inbox.getStats();

    // Alert if inbox is overflowing
    if (stats.pending > 50) {
      this.logger.warn(`Agent ${agentId} inbox overflowing: ${stats.pending} pending tasks`);

      await inbox.sendNotification({
        type: 'inbox_overflow',
        message: `You have ${stats.pending} pending tasks`,
        priority: 8,
      });

      this.eventEmitter.emit('agent.inbox_overflow', {
        agentId,
        pendingCount: stats.pending,
        timestamp: new Date(),
      });
    }

    // Check if agent is stuck (has in-progress tasks but no heartbeat)
    if (stats.inProgress > 0) {
      const status = this.heartbeatService.getAgentStatus(agentId);
      if (status && status.status === 'stalled') {
        this.logger.warn(`Agent ${agentId} is stalled with ${stats.inProgress} in-progress tasks`);
        await this.handleAgentFailure(agentId, { reason: 'stalled_with_tasks' });
      }
    }
  }

  // ============ FAILURE HANDLING ============

  /**
   * Handle agent failure
   */
  async handleAgentFailure(agentId: string, alert: any): Promise<void> {
    this.logger.error(`Handling failure for agent ${agentId}:`, alert);

    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
    const stats = await inbox.getStats();

    // If agent has pending tasks, redistribute them
    if (stats.pending > 0) {
      this.logger.log(`Redistributing ${stats.pending} tasks from failed agent ${agentId}`);
      await this.redistributeTasks(agentId);
    }

    // If agent has in-progress tasks, mark them as failed
    if (stats.inProgress > 0) {
      this.logger.log(`Failing ${stats.inProgress} in-progress tasks from agent ${agentId}`);
      await this.failInProgressTasks(agentId);
    }

    // Attempt recovery
    await this.attemptAgentRecovery(agentId);
  }

  /**
   * Handle agent emergency (requires human intervention)
   */
  async handleAgentEmergency(agentId: string, alert: any): Promise<void> {
    this.logger.error(`⚠️ EMERGENCY for agent ${agentId}:`, alert);

    // Store emergency alert
    await this.redis.lpush(
      'agent:emergencies',
      JSON.stringify({
        agentId,
        alert,
        timestamp: new Date(),
      })
    );

    // Notify admin (TODO: implement admin notification system)
    this.eventEmitter.emit('system.admin_notification_required', {
      type: 'agent_emergency',
      agentId,
      alert,
      timestamp: new Date(),
    });

    // Attempt recovery anyway
    await this.handleAgentFailure(agentId, alert);
  }

  /**
   * Redistribute tasks from failed agent
   */
  private async redistributeTasks(agentId: string): Promise<void> {
    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
    const pendingTasks = await inbox.getPendingTasks();

    for (const task of pendingTasks) {
      this.logger.log(`Redistributing task ${task.id} from agent ${agentId}`);

      // Remove from current inbox
      await this.redis.lrem(`agent:${agentId}:inbox:tasks:pending`, 1, JSON.stringify(task));

      // Add back to global task queue for re-routing
      await this.redis.lpush('task:queue', JSON.stringify(task));

      this.eventEmitter.emit('task.redistributed', {
        taskId: task.id,
        from: agentId,
        timestamp: new Date(),
      });
    }

    this.logger.log(`Redistributed ${pendingTasks.length} tasks from agent ${agentId}`);
  }

  /**
   * Fail all in-progress tasks from agent
   */
  private async failInProgressTasks(agentId: string): Promise<void> {
    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
    const inProgressTasks = await inbox.getInProgressTasks();

    for (const task of inProgressTasks) {
      await inbox.failTask(task.id, 'Agent failed while processing task');
    }

    this.logger.log(`Failed ${inProgressTasks.length} in-progress tasks from agent ${agentId}`);
  }

  /**
   * Attempt to recover failed agent
   */
  async attemptAgentRecovery(agentId: string): Promise<void> {
    this.logger.log(`Attempting recovery for agent ${agentId}`);

    try {
      // 1. Re-register agent (fresh context)
      const registration = this.agents.get(agentId);
      if (!registration) {
        this.logger.error(`Cannot recover agent ${agentId}: registration not found`);
        return;
      }

      // 2. Reset heartbeat
      this.heartbeatService.registerAgent(agentId, registration.expectedResponseTime);

      // 3. Send recovery task
      const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
      await inbox.receiveTask({
        id: `recover-${agentId}`,
        type: 'recovery',
        priority: 10,
        data: {
          message: 'Agent recovery initiated',
          previousFailure: true,
          reloadContext: true,
          contextFiles: [
            '.agent/skills/library-of-living-knowledge/SKILL.md',
            '.agent/context/agent-onboarding.md',
          ],
        },
      });

      this.eventEmitter.emit('agent.lifecycle.recovery_attempted', {
        agentId,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Recovery task sent to agent ${agentId}`);
    } catch (error) {
      this.logger.error(`Failed to recover agent ${agentId}:`, error);
    }
  }

  // ============ AGENT SHUTDOWN ============

  /**
   * Gracefully shutdown an agent
   */
  async shutdownAgent(agentId: string): Promise<void> {
    this.logger.log(`Shutting down agent: ${agentId}`);

    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);

    // Redistribute pending tasks
    await this.redistributeTasks(agentId);

    // Mark agent as inactive
    await this.redis.hset(`agent:${agentId}:registration`, 'status', 'inactive');

    // Remove from agents map
    this.agents.delete(agentId);

    this.eventEmitter.emit('agent.lifecycle.shutdown', {
      agentId,
      timestamp: new Date(),
    });

    this.logger.log(`✅ Agent ${agentId} shut down gracefully`);
  }

  // ============ UTILITIES ============

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentRegistration | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents with specific capability
   */
  async findAgentsWithCapability(capability: string): Promise<string[]> {
    const agents: string[] = [];

    for (const [agentId] of this.agents) {
      const hasCapability = await this.redis.sismember(`agent:${agentId}:capabilities`, capability);
      if (hasCapability) {
        agents.push(agentId);
      }
    }

    return agents;
  }

  /**
   * Find agents with multiple capabilities
   */
  async findAgentsWithCapabilities(capabilities: string[]): Promise<string[]> {
    const agents: string[] = [];

    for (const [agentId] of this.agents) {
      const agentCapabilities = await this.redis.smembers(`agent:${agentId}:capabilities`);
      const hasAll = capabilities.every((cap) => agentCapabilities.includes(cap));
      if (hasAll) {
        agents.push(agentId);
      }
    }

    return agents;
  }
}
