import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisAgentRegistry } from '@the-new-fuse/agent';
import { createTNFEnvelope, TNFEnvelope, validateTNFEnvelope } from '@the-new-fuse/relay-core';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SystemQueueName, SystemQueueService } from './services/system-queue.service';
import { telemetry } from '../telemetry/TelemetryService.js';

export interface RouterConfig {
  redisUrl: string;
  ingressChannel: string;
  egressChannelPrefix: string;
  enableInboxRouting?: boolean; // NEW: Enable agent inbox integration
}

interface RoutedAgentTask {
  id: string;
  type: string;
  data: unknown;
  priority: number;
  createdAt: Date;
  delegatedFrom?: string;
  requiresSkills: string[];
  metadata: Record<string, unknown>;
}

class RouterAgentInbox {
  constructor(
    private readonly agentId: string,
    private readonly redisService: UnifiedRedisService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  private get pendingKey(): string {
    return `agent:${this.agentId}:inbox:tasks:pending`;
  }

  async receiveTask(task: RoutedAgentTask): Promise<void> {
    await this.redisService.lpush(this.pendingKey, JSON.stringify(task));
    this.eventEmitter.emit('agent.inbox.task_received', {
      agentId: this.agentId,
      taskId: task.id,
      timestamp: new Date(),
    });
  }

  async getPendingCount(): Promise<number> {
    return this.redisService.llen(this.pendingKey);
  }
}

export class TNFRouter {
  private registry: RedisAgentRegistry;
  private systemQueue: SystemQueueService;
  private config: RouterConfig;
  private eventEmitter: EventEmitter2; // NEW: For inbox events
  private redisService: UnifiedRedisService;

  constructor(
    redisService: UnifiedRedisService,
    config: Partial<RouterConfig> = {},
    eventEmitter?: EventEmitter2
  ) {
    this.redisService = redisService;
    this.config = {
      redisUrl:
        config.redisUrl ||
        process.env.REDIS_URL ||
        process.env.CLOUD_RUNTIME_REDIS_URL ||
        process.env.LIVE_REDIS_URL ||
        process.env.REDIS_PRIVATE_URL ||
        process.env.REDIS_TLS_URL ||
        'redis://localhost:6379',
      ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
      egressChannelPrefix: config.egressChannelPrefix || 'tnf:bus:egress',
      enableInboxRouting: config.enableInboxRouting ?? true, // Default: enabled
    };

    this.registry = new RedisAgentRegistry({ redisUrl: this.config.redisUrl });
    this.systemQueue = new SystemQueueService(this.config.redisUrl);

    // NEW: EventEmitter for agent inbox events
    this.eventEmitter = eventEmitter || new EventEmitter2();
  }

  async start(): Promise<void> {
    await this.registry.connect();
    // SystemQueue initializes its own connections internally

    // Subscribe to ingress
    await this.redisService.subscribe(this.config.ingressChannel, (message) => {
      const payload =
        typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
      this.handleIngressMessage(payload);
    });

    console.log(`[Router] Listening on ${this.config.ingressChannel}`);
    console.log(
      `[Router] Inbox routing: ${this.config.enableInboxRouting ? 'ENABLED' : 'DISABLED'}`
    );
  }

  async stop(): Promise<void> {
    await this.registry.disconnect();
    await this.systemQueue.close();
  }

  private async handleIngressMessage(rawMessage: string): Promise<void> {
    try {
      const envelope = validateTNFEnvelope(JSON.parse(rawMessage));
      console.log(`[Router] Processing envelope: ${envelope.id} type=${envelope.type}`);

      switch (envelope.type) {
        case 'task':
          await this.routeTask(envelope);
          break;
        case 'query':
          await this.routeQuery(envelope);
          break;
        case 'event':
          // Events are typically broadcast or logged
          await this.logEvent(envelope);
          break;
        default:
          console.log(`[Router] No route for type: ${envelope.type}`);
      }
    } catch (error) {
      console.error('[Router] routing error:', error);
    }
  }

  /**
   * Route a task to the best capable agent OR system queue
   *
   * NEW: Enhanced with agent inbox routing and load balancing
   */
  private async routeTask(envelope: TNFEnvelope): Promise<void> {
    const payload = envelope.payload as any;
    const requiredCapability = payload.requiredCapability || 'general';
    await this.logTaskExecution(envelope.id, 'Task received by router', {
      stage: 'ingress',
      metadata: { requiredCapability },
    });

    // CHECK FOR SYSTEM CAPABILITIES
    if (requiredCapability.startsWith('system:')) {
      await this.routeSystemTask(requiredCapability, envelope);
      return;
    }

    // 1. Find capable agents
    const candidates = await this.registry.findAgentsByCapability(requiredCapability);

    if (candidates.length === 0) {
      console.warn(`[Router] No agents found for capability: ${requiredCapability}`);
      await this.logTaskExecution(envelope.id, 'No eligible agent found', {
        level: 'warn',
        stage: 'routing',
        metadata: { requiredCapability },
      });
      await this.sendError(
        envelope,
        'NO_AGENT_FOUND',
        `No agent with capability ${requiredCapability}`
      );
      return;
    }

    // 2. NEW: Load balancing - select agent with fewest pending tasks
    let targetAgentId = candidates[0].id;

    if (this.config.enableInboxRouting && candidates.length > 1) {
      targetAgentId = await this.selectBestAgent(candidates.map((c) => c.id));
    }

    console.log(`[Router] Routing task to agent: ${targetAgentId}`);
    await this.logTaskExecution(envelope.id, `Routing to agent ${targetAgentId}`, {
      stage: 'routing',
      metadata: { targetAgentId },
    });

    // 3. NEW: Route to agent's inbox (if enabled) or direct channel
    if (this.config.enableInboxRouting) {
      await this.routeToInbox(targetAgentId, envelope);
    } else {
      await this.forwardToAgent(targetAgentId, envelope);
    }
  }

  /**
   * NEW: Route task to agent's inbox
   */
  private async routeToInbox(agentId: string, envelope: TNFEnvelope): Promise<void> {
    try {
      const inbox = new RouterAgentInbox(agentId, this.redisService, this.eventEmitter);

      // Convert TNFEnvelope to AgentTask
      const task = {
        id: envelope.id,
        type: (envelope.payload as any).taskType || 'generic',
        data: envelope.payload,
        priority: (envelope.payload as any).priority || 5,
        createdAt: new Date(envelope.timestamp),
        delegatedFrom: envelope.from?.agentId,
        requiresSkills: (envelope.payload as any).requiredSkills || [],
        metadata: {
          envelopeId: envelope.id,
          traceId: envelope.traceId,
          from: envelope.from,
        },
      };

      await inbox.receiveTask(task);
      console.log(`[Router] Task ${envelope.id} delivered to inbox of agent ${agentId}`);
      await this.logTaskExecution(envelope.id, `Delivered to inbox: ${agentId}`, {
        stage: 'dispatch',
        metadata: { agentId, via: 'inbox' },
      });

      // Emit routing event
      this.eventEmitter.emit('router.task_routed', {
        taskId: envelope.id,
        agentId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`[Router] Failed to route to inbox for agent ${agentId}:`, error);
      await this.logTaskExecution(envelope.id, `Inbox delivery failed for ${agentId}`, {
        level: 'warn',
        stage: 'dispatch',
        metadata: { agentId, error: String((error as any)?.message || error) },
      });
      // Fallback to direct channel
      await this.forwardToAgent(agentId, envelope);
    }
  }

  /**
   * NEW: Select best agent based on load balancing (fewest pending tasks)
   */
  private async selectBestAgent(agentIds: string[]): Promise<string> {
    const loadMap: Map<string, number> = new Map();

    // Check inbox load for each agent
    for (const agentId of agentIds) {
      try {
        const inbox = new RouterAgentInbox(agentId, this.redisService, this.eventEmitter);
        const pendingCount = await inbox.getPendingCount();
        loadMap.set(agentId, pendingCount);
      } catch (error) {
        console.error(`[Router] Error checking load for agent ${agentId}:`, error);
        loadMap.set(agentId, 9999); // Assume high load if error
      }
    }

    // Return agent with minimum load
    const sorted = Array.from(loadMap.entries()).sort((a, b) => a[1] - b[1]);
    const selected = sorted[0][0];

    console.log(`[Router] Load balancing selected agent ${selected} (pending: ${sorted[0][1]})`);
    return selected;
  }

  /**
   * Route to Backend Bull Queue
   */
  private async routeSystemTask(capability: string, envelope: TNFEnvelope): Promise<void> {
    console.log(`[Router] Routing system task: ${capability}`);

    try {
      let queueName: SystemQueueName;
      let jobType = 'process'; // Default job name

      switch (capability) {
        case 'system:email':
          queueName = SystemQueueName.EMAIL;
          jobType = 'send-email';
          break;
        case 'system:report':
          queueName = SystemQueueName.REPORT_GENERATION;
          break;
        case 'system:data-sync':
          queueName = SystemQueueName.DATA_SYNC;
          break;
        case 'system:agent-exec':
          queueName = SystemQueueName.AGENT_EXECUTION;
          break;
        default:
          throw new Error(`Unknown system capability: ${capability}`);
      }

      const jobId = await this.systemQueue.dispatchTask(queueName, jobType, envelope.payload);
      console.log(`[Router] Dispatched to queue ${queueName}, Job ID: ${jobId}`);
      await this.logTaskExecution(envelope.id, `Dispatched to system queue ${queueName}`, {
        stage: 'dispatch',
        metadata: { queueName, jobId, capability },
      });
    } catch (error: any) {
      console.error(`[Router] System task failed:`, error);
      await this.logTaskExecution(envelope.id, 'System task dispatch failed', {
        level: 'error',
        stage: 'dispatch',
        metadata: { capability, error: String(error?.message || error) },
      });
      await this.sendError(envelope, 'SYSTEM_TASK_FAILED', error.message);
    }
  }

  /**
   * Route a query (information request)
   */
  private async routeQuery(envelope: TNFEnvelope): Promise<void> {
    // Similar to task, but might multicast
    await this.routeTask(envelope);
  }

  /**
   * Forward envelope to specific agent (legacy/fallback method)
   */
  private async forwardToAgent(agentId: string, envelope: TNFEnvelope): Promise<void> {
    const channel = `${this.config.egressChannelPrefix}:${agentId}`;
    await this.redisService.publish(channel, JSON.stringify(envelope));
    console.log(`[Router] Forwarded to ${channel}`);
    await this.logTaskExecution(envelope.id, `Forwarded to channel ${channel}`, {
      stage: 'dispatch',
      metadata: { agentId, channel, via: 'pubsub' },
    });
  }

  /**
   * Send error response
   */
  private async sendError(
    originalEnvelope: TNFEnvelope,
    code: string,
    message: string
  ): Promise<void> {
    const errorEnvelope = createTNFEnvelope(
      'response',
      { agentId: 'orchestrator', role: 'orchestrator' },
      originalEnvelope.from,
      {
        success: false,
        error: { code, message },
      },
      {
        parentMessageId: originalEnvelope.id,
      }
    );

    // Send back to the sender
    if (this.config.enableInboxRouting) {
      // Try to route error to sender's inbox
      try {
        await this.routeToInbox(originalEnvelope.from.agentId, errorEnvelope);
      } catch (error) {
        // Fallback to direct channel
        await this.forwardToAgent(originalEnvelope.from.agentId, errorEnvelope);
      }
    } else {
      await this.forwardToAgent(originalEnvelope.from.agentId, errorEnvelope);
    }
  }

  private async logEvent(envelope: TNFEnvelope): Promise<void> {
    // TODO: Write to audit stream
    console.log('[Router] Event logged:', envelope.id);
  }

  /**
   * NEW: Get routing statistics
   */
  async getRoutingStats(): Promise<{
    totalAgents: number;
    agentLoads: Map<string, number>;
  }> {
    const agents = await this.registry.findAgentsByCapability('*'); // Get all agents
    const loadMap: Map<string, number> = new Map();

    for (const agent of agents) {
      try {
        const inbox = new RouterAgentInbox(agent.id, this.redisService, this.eventEmitter);
        const pendingCount = await inbox.getPendingCount();
        loadMap.set(agent.id, pendingCount);
      } catch (error) {
        loadMap.set(agent.id, -1); // Error state
      }
    }

    return {
      totalAgents: agents.length,
      agentLoads: loadMap,
    };
  }

  private async logTaskExecution(
    taskId: string,
    message: string,
    options?: { level?: 'info' | 'warn' | 'error'; stage?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    await telemetry.emitAndPersistTaskExecutionLog({
      taskId,
      message,
      level: options?.level || 'info',
      actor: 'tnf-router',
      source: 'workflow-engine.router',
      stage: options?.stage,
      metadata: options?.metadata,
    });
  }
}
