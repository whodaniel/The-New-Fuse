import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { AgentLifecycleManager } from './AgentLifecycleManager';
import { AgentInbox } from '../../shared/agent-inbox';

// Types for the orchestrator services
interface HeartbeatConfig {
  intervalMs: number;
  timeoutMs: number;
  maxRetries: number;
  escalationDelay: number;
  stagnationThresholdMs: number;
}

interface AgentHeartbeat {
  agentId: string;
  lastHeartbeat: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'stalled' | 'failed';
  consecutiveFailures: number;
  currentTask?: string;
  expectedResponseTime?: number;
}

interface StagnationAlert {
  agentId: string;
  taskId: string;
  stagnationType: 'no_heartbeat' | 'no_progress' | 'circular_communication' | 'timeout';
  detectedAt: Date;
  duration: number;
  severity: 'warning' | 'critical' | 'emergency';
}

/**
 * Heartbeat Monitoring Service
 * Monitors agent health and detects stagnation
 */
class HeartbeatMonitoringService {
  private readonly logger = new Logger('HeartbeatMonitoring');
  private config: HeartbeatConfig;
  private agentHeartbeats: Map<string, AgentHeartbeat> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventEmitter: EventEmitter2;

  constructor(config: HeartbeatConfig, eventEmitter: EventEmitter2) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  start(): void {
    this.logger.log('🔔 Starting Heartbeat Monitoring Service');
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.intervalMs);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.log('🔕 Heartbeat Monitoring Service stopped');
  }

  registerAgent(agentId: string, expectedResponseTime?: number): void {
    const now = new Date();
    this.agentHeartbeats.set(agentId, {
      agentId,
      lastHeartbeat: now,
      lastActivity: now,
      status: 'active',
      consecutiveFailures: 0,
      expectedResponseTime: expectedResponseTime || this.config.timeoutMs,
    });
    this.logger.log(`✅ Agent registered for heartbeat monitoring: ${agentId}`);
    this.eventEmitter.emit('agent.registered', { agentId, timestamp: now });
  }

  recordHeartbeat(agentId: string, taskId?: string): void {
    const heartbeat = this.agentHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.lastHeartbeat = new Date();
      heartbeat.consecutiveFailures = 0;
      heartbeat.status = 'active';
      if (taskId) {
        heartbeat.currentTask = taskId;
      }
      this.eventEmitter.emit('agent.heartbeat', { agentId, taskId, timestamp: new Date() });
    }
  }

  recordActivity(agentId: string, activityType: string, metadata?: Record<string, unknown>): void {
    const heartbeat = this.agentHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.lastActivity = new Date();
      this.eventEmitter.emit('agent.activity', {
        agentId,
        activityType,
        metadata,
        timestamp: new Date(),
      });
    }
  }

  private performHealthCheck(): void {
    const now = new Date();

    for (const [agentId, heartbeat] of this.agentHeartbeats) {
      const timeSinceHeartbeat = now.getTime() - heartbeat.lastHeartbeat.getTime();
      const timeSinceActivity = now.getTime() - heartbeat.lastActivity.getTime();

      // Check for heartbeat timeout
      if (timeSinceHeartbeat > this.config.timeoutMs) {
        heartbeat.consecutiveFailures++;

        if (heartbeat.consecutiveFailures >= this.config.maxRetries) {
          heartbeat.status = 'failed';
          this.emitStagnationAlert(agentId, heartbeat, 'no_heartbeat', timeSinceHeartbeat);
        } else {
          heartbeat.status = 'stalled';
        }
      }

      // Check for activity stagnation
      if (timeSinceActivity > this.config.stagnationThresholdMs && heartbeat.currentTask) {
        this.emitStagnationAlert(agentId, heartbeat, 'no_progress', timeSinceActivity);
      }
    }
  }

  private emitStagnationAlert(
    agentId: string,
    heartbeat: AgentHeartbeat,
    type: StagnationAlert['stagnationType'],
    duration: number
  ): void {
    const severity: StagnationAlert['severity'] =
      duration > this.config.stagnationThresholdMs * 3
        ? 'emergency'
        : duration > this.config.stagnationThresholdMs * 2
          ? 'critical'
          : 'warning';

    const alert: StagnationAlert = {
      agentId,
      taskId: heartbeat.currentTask || 'unknown',
      stagnationType: type,
      detectedAt: new Date(),
      duration,
      severity,
    };

    this.logger.warn(`⚠️ Stagnation detected for agent ${agentId}: ${type} (${severity})`);
    this.eventEmitter.emit('agent.stagnation', alert);
  }

  getAgentStatus(agentId: string): AgentHeartbeat | undefined {
    return this.agentHeartbeats.get(agentId);
  }

  getAllAgentStatuses(): Map<string, AgentHeartbeat> {
    return this.agentHeartbeats;
  }

  getHealthMetrics(): {
    totalAgents: number;
    activeAgents: number;
    stalledAgents: number;
    failedAgents: number;
  } {
    let active = 0,
      stalled = 0,
      failed = 0;

    for (const heartbeat of this.agentHeartbeats.values()) {
      switch (heartbeat.status) {
        case 'active':
          active++;
          break;
        case 'stalled':
          stalled++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      totalAgents: this.agentHeartbeats.size,
      activeAgents: active,
      stalledAgents: stalled,
      failedAgents: failed,
    };
  }
}

/**
 * Orchestrator Service
 * Main service for coordinating agents within TNF
 * 
 * NEW: Integrated with AgentLifecycleManager
 */
@Injectable()
export class OrchestratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('OrchestratorService');
  private heartbeatService: HeartbeatMonitoringService | null = null;
  private lifecycleManager: AgentLifecycleManager | null = null; // NEW
  private tnfHeartbeatInterval: NodeJS.Timeout | null = null;
  private redis: Redis; // NEW

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2
  ) {
    // NEW: Initialize Redis client
    const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 Initializing TNF Orchestrator Module...');

// Types for the orchestrator services
interface HeartbeatConfig {
  intervalMs: number;
  timeoutMs: number;
  maxRetries: number;
  escalationDelay: number;
  stagnationThresholdMs: number;
}

interface AgentHeartbeat {
  agentId: string;
  lastHeartbeat: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'stalled' | 'failed';
  consecutiveFailures: number;
  currentTask?: string;
  expectedResponseTime?: number;
}

interface StagnationAlert {
  agentId: string;
  taskId: string;
  stagnationType: 'no_heartbeat' | 'no_progress' | 'circular_communication' | 'timeout';
  detectedAt: Date;
  duration: number;
  severity: 'warning' | 'critical' | 'emergency';
}

/**
 * Heartbeat Monitoring Service
 * Monitors agent health and detects stagnation
 */
class HeartbeatMonitoringService {
  private readonly logger = new Logger('HeartbeatMonitoring');
  private config: HeartbeatConfig;
  private agentHeartbeats: Map<string, AgentHeartbeat> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventEmitter: EventEmitter2;

  constructor(config: HeartbeatConfig, eventEmitter: EventEmitter2) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  start(): void {
    this.logger.log('🔔 Starting Heartbeat Monitoring Service');
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.intervalMs);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.log('🔕 Heartbeat Monitoring Service stopped');
  }

  registerAgent(agentId: string, expectedResponseTime?: number): void {
    const now = new Date();
    this.agentHeartbeats.set(agentId, {
      agentId,
      lastHeartbeat: now,
      lastActivity: now,
      status: 'active',
      consecutiveFailures: 0,
      expectedResponseTime: expectedResponseTime || this.config.timeoutMs,
    });
    this.logger.log(`✅ Agent registered for heartbeat monitoring: ${agentId}`);
    this.eventEmitter.emit('agent.registered', { agentId, timestamp: now });
  }

  recordHeartbeat(agentId: string, taskId?: string): void {
    const heartbeat = this.agentHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.lastHeartbeat = new Date();
      heartbeat.consecutiveFailures = 0;
      heartbeat.status = 'active';
      if (taskId) {
        heartbeat.currentTask = taskId;
      }
      this.eventEmitter.emit('agent.heartbeat', { agentId, taskId, timestamp: new Date() });
    }
  }

  recordActivity(agentId: string, activityType: string, metadata?: Record<string, unknown>): void {
    const heartbeat = this.agentHeartbeats.get(agentId);
    if (heartbeat) {
      heartbeat.lastActivity = new Date();
      this.eventEmitter.emit('agent.activity', {
        agentId,
        activityType,
        metadata,
        timestamp: new Date(),
      });
    }
  }

  private performHealthCheck(): void {
    const now = new Date();

    for (const [agentId, heartbeat] of this.agentHeartbeats) {
      const timeSinceHeartbeat = now.getTime() - heartbeat.lastHeartbeat.getTime();
      const timeSinceActivity = now.getTime() - heartbeat.lastActivity.getTime();

      // Check for heartbeat timeout
      if (timeSinceHeartbeat > this.config.timeoutMs) {
        heartbeat.consecutiveFailures++;

        if (heartbeat.consecutiveFailures >= this.config.maxRetries) {
          heartbeat.status = 'failed';
          this.emitStagnationAlert(agentId, heartbeat, 'no_heartbeat', timeSinceHeartbeat);
        } else {
          heartbeat.status = 'stalled';
        }
      }

      // Check for activity stagnation
      if (timeSinceActivity > this.config.stagnationThresholdMs && heartbeat.currentTask) {
        this.emitStagnationAlert(agentId, heartbeat, 'no_progress', timeSinceActivity);
      }
    }
  }

  private emitStagnationAlert(
    agentId: string,
    heartbeat: AgentHeartbeat,
    type: StagnationAlert['stagnationType'],
    duration: number
  ): void {
    const severity: StagnationAlert['severity'] =
      duration > this.config.stagnationThresholdMs * 3
        ? 'emergency'
        : duration > this.config.stagnationThresholdMs * 2
          ? 'critical'
          : 'warning';

    const alert: StagnationAlert = {
      agentId,
      taskId: heartbeat.currentTask || 'unknown',
      stagnationType: type,
      detectedAt: new Date(),
      duration,
      severity,
    };

    this.logger.warn(`⚠️ Stagnation detected for agent ${agentId}: ${type} (${severity})`);
    this.eventEmitter.emit('agent.stagnation', alert);
  }

  getAgentStatus(agentId: string): AgentHeartbeat | undefined {
    return this.agentHeartbeats.get(agentId);
  }

  getAllAgentStatuses(): Map<string, AgentHeartbeat> {
    return this.agentHeartbeats;
  }

  getHealthMetrics(): {
    totalAgents: number;
    activeAgents: number;
    stalledAgents: number;
    failedAgents: number;
  } {
    let active = 0,
      stalled = 0,
      failed = 0;

    for (const heartbeat of this.agentHeartbeats.values()) {
      switch (heartbeat.status) {
        case 'active':
          active++;
          break;
        case 'stalled':
          stalled++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      totalAgents: this.agentHeartbeats.size,
      activeAgents: active,
      stalledAgents: stalled,
      failedAgents: failed,
    };
  }
}

/**
 * Orchestrator Service
 * Main service for coordinating agents within TNF
 */
@Injectable()
export class OrchestratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('OrchestratorService');
  private heartbeatService: HeartbeatMonitoringService | null = null;
  private tnfHeartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 Initializing TNF Orchestrator Module...');

    // Initialize Heartbeat Monitoring
    const heartbeatConfig: HeartbeatConfig = {
      intervalMs: parseInt(this.configService.get('HEARTBEAT_INTERVAL_MS') || '5000'),
      timeoutMs: parseInt(this.configService.get('HEARTBEAT_TIMEOUT_MS') || '15000'),
      maxRetries: parseInt(this.configService.get('HEARTBEAT_MAX_RETRIES') || '3'),
      escalationDelay: parseInt(this.configService.get('HEARTBEAT_ESCALATION_DELAY') || '10000'),
      stagnationThresholdMs: parseInt(this.configService.get('STAGNATION_THRESHOLD_MS') || '30000'),
    };

    this.heartbeatService = new HeartbeatMonitoringService(heartbeatConfig, this.eventEmitter);
    this.heartbeatService.start();

    // Register TNF itself as the Master Agent
    this.heartbeatService.registerAgent('tnf-core', 60000);
    this.logger.log('🎯 TNF Core registered as Master Agent');

    // Start self-heartbeat for TNF Core
    this.tnfHeartbeatInterval = setInterval(() => {
      this.recordAgentHeartbeat('tnf-core', 'orchestration');
      this.heartbeatService?.recordActivity('tnf-core', 'monitoring');
    }, 5000);

    // Setup event listeners
    this.setupEventListeners();

    this.logger.log('✅ TNF Orchestrator Module initialized successfully');
    this.logger.log(
      `📊 Heartbeat Config: interval=${heartbeatConfig.intervalMs}ms, timeout=${heartbeatConfig.timeoutMs}ms`
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('🛑 Shutting down TNF Orchestrator Module...');

    if (this.tnfHeartbeatInterval) {
      clearInterval(this.tnfHeartbeatInterval);
      this.tnfHeartbeatInterval = null;
    }

    if (this.heartbeatService) {
      this.heartbeatService.stop();
    }

    this.logger.log('✅ TNF Orchestrator Module shut down gracefully');
  }

  private setupEventListeners(): void {
    // Listen for agent registration events
    this.eventEmitter.on('agent.registered', (data: { agentId: string; timestamp: Date }) => {
      this.logger.log(`📝 Agent registration event: ${data.agentId}`);
    });

    // Listen for heartbeat events
    this.eventEmitter.on(
      'agent.heartbeat',
      (data: { agentId: string; taskId?: string; timestamp: Date }) => {
        this.logger.debug(
          `💓 Heartbeat from ${data.agentId}${data.taskId ? ` (task: ${data.taskId})` : ''}`
        );
      }
    );

    // Listen for stagnation events
    this.eventEmitter.on('agent.stagnation', (alert: StagnationAlert) => {
      this.handleStagnation(alert);
    });
  }

  private handleStagnation(alert: StagnationAlert): void {
    this.logger.warn(`🚨 Handling stagnation for agent ${alert.agentId}: ${alert.stagnationType}`);

    switch (alert.severity) {
      case 'warning':
        // Attempt ping/retry
        this.logger.log(`🔄 Attempting to ping agent ${alert.agentId}`);
        break;
      case 'critical':
        // Attempt task reassignment
        this.logger.warn(`⚠️ Escalating: may need to reassign task from ${alert.agentId}`);
        break;
      case 'emergency':
        // Notify human intervention
        this.logger.error(`🆘 EMERGENCY: Agent ${alert.agentId} requires human intervention`);
        this.eventEmitter.emit('agent.emergency', alert);
        break;
    }
  }

  // Public API for other services to interact with the orchestrator
  getHeartbeatService(): HeartbeatMonitoringService | null {
    return this.heartbeatService;
  }

  registerAgent(agentId: string, expectedResponseTime?: number): void {
    if (this.heartbeatService) {
      this.heartbeatService.registerAgent(agentId, expectedResponseTime);
    }
  }

  recordAgentHeartbeat(agentId: string, taskId?: string): void {
    if (this.heartbeatService) {
      this.heartbeatService.recordHeartbeat(agentId, taskId);
    }
  }

  getSystemHealth(): ReturnType<HeartbeatMonitoringService['getHealthMetrics']> | null {
    return this.heartbeatService?.getHealthMetrics() || null;
  }
}

export { AgentHeartbeat, HeartbeatConfig, HeartbeatMonitoringService, StagnationAlert };
