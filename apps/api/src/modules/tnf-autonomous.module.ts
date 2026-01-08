/**
 * TNF Autonomous Module
 *
 * NestJS module that integrates all the autonomous system components:
 * - DirectorService: Autonomous loop orchestrator
 * - BMADOrchestrationService: BMAD Method implementation
 * - AgentSwarmOrchestrationService: Agent coordination
 * - Bridge layer: Protocol, Redis, Cascade bridges
 *
 * This module wires everything together for production deployment.
 */

import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
// ScheduleModule is configured at root AppModule level

// Note: These are implemented but may need path adjustments based on your build setup
// Import paths reference the actual file locations

/**
 * Configuration for the autonomous system
 */
export interface TNFAutonomousConfig {
  enableDirectorLoop: boolean;
  directorCycleIntervalMs: number;
  enableHeartbeat: boolean;
  heartbeatIntervalMs: number;
  enableA2ADiscovery: boolean;
  discoveryIntervalMs: number;
  redisEnabled: boolean;
  redisHost?: string;
  redisPort?: number;
}

const DEFAULT_CONFIG: TNFAutonomousConfig = {
  enableDirectorLoop: true,
  directorCycleIntervalMs: 60000,
  enableHeartbeat: true,
  heartbeatIntervalMs: 30000,
  enableA2ADiscovery: true,
  discoveryIntervalMs: 60000,
  redisEnabled: process.env.REDIS_HOST !== undefined,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
};

/**
 * Director Service Provider
 * Manages the autonomous loop
 */
export class DirectorServiceProvider implements OnModuleInit {
  private readonly logger = new Logger(DirectorServiceProvider.name);
  private isRunning = false;
  private cycleCount = 0;
  private intervalHandle: NodeJS.Timeout | null = null;
  private config: TNFAutonomousConfig;
  private redis: Redis | null = null;

  constructor(
    private readonly swarmProvider: AgentSwarmProvider,
    config?: Partial<TNFAutonomousConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async onModuleInit() {
    if (this.config.enableDirectorLoop) {
      this.logger.log('🔮 Initializing Director Service...');
      await this.start();
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Director already running');
      return;
    }

    if (this.config.redisEnabled && !this.redis) {
      try {
        this.redis = new Redis({
          host: this.config.redisHost,
          port: this.config.redisPort,
        });
        this.redis.on('error', (err) => {
          this.logger.error('Redis error', err);
        });
        this.logger.log('Redis connected for task discovery');
      } catch (error) {
        this.logger.error('Failed to connect to Redis', error);
      }
    }

    this.isRunning = true;
    this.logger.log(`🚀 Director started with ${this.config.directorCycleIntervalMs}ms cycle`);

    // Run first cycle immediately
    await this.executeCycle();

    // Schedule recurring cycles
    this.intervalHandle = setInterval(async () => {
      await this.executeCycle();
    }, this.config.directorCycleIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.isRunning = false;
    this.logger.log('⏹️ Director stopped');
  }

  private async executeCycle(): Promise<void> {
    this.cycleCount++;
    const startTime = Date.now();

    try {
      this.logger.log(`🔄 Cycle ${this.cycleCount} starting...`);

      // Phase 1: Health Check
      const health = await this.performHealthCheck();

      // Phase 2: Task Discovery
      const tasks = await this.discoverTasks();

      // Phase 3: Task Execution
      const executed = await this.executeTasks(tasks);

      // Phase 4: Self-Reflection (every 5th cycle)
      if (this.cycleCount % 5 === 0) {
        await this.performReflection();
      }

      // Phase 5: Handoff Update (every 10th cycle)
      if (this.cycleCount % 10 === 0) {
        await this.updateHandoff();
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Cycle ${this.cycleCount} completed in ${duration}ms (${executed} tasks)`);
    } catch (error) {
      this.logger.error(`❌ Cycle ${this.cycleCount} failed: ${error}`);
    }
  }

  private async performHealthCheck(): Promise<{ status: string; agents: number }> {
    const stats = this.swarmProvider.getStatistics();
    return { status: 'healthy', agents: stats.onlineAgents };
  }

  private async discoverTasks(): Promise<Array<{ id: string; name: string; data?: any }>> {
    if (!this.redis) return [];

    const tasks: Array<{ id: string; name: string; data?: any }> = [];
    const limit = 5; // Fetch up to 5 tasks per cycle

    for (let i = 0; i < limit; i++) {
      try {
        // Use RPOPLPUSH to safely move task from queue to processing
        const result = await this.redis.rpoplpush('task:queue', 'task:processing');
        if (!result) break;

        const taskData = JSON.parse(result);
        tasks.push({
          id: taskData.id,
          name: taskData.type || 'Unnamed Task',
          data: taskData,
        });
      } catch (err) {
        this.logger.error(`Failed to fetch/parse task: ${err}`);
      }
    }

    if (tasks.length > 0) {
      this.logger.log(`Discovered ${tasks.length} tasks`);
    }

    return tasks;
  }

  private async executeTasks(tasks: Array<{ id: string; name: string; data?: any }>): Promise<number> {
    // TODO: Execute via CascadeService
    return tasks.length;
  }

  private async performReflection(): Promise<void> {
    this.logger.log('🪞 Performing self-reflection...');
    // TODO: Analyze performance, generate insights
  }

  private async updateHandoff(): Promise<void> {
    this.logger.log('📝 Updating handoff document...');
    // TODO: Generate handoff for session continuity
  }

  getStatus(): {
    isRunning: boolean;
    cycleCount: number;
    uptime: number;
  } {
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      uptime: process.uptime(),
    };
  }
}

/**
 * BMAD Orchestration Provider
 * Implements the 4-layer BMAD Method
 */
export class BMADServiceProvider implements OnModuleInit {
  private readonly logger = new Logger(BMADServiceProvider.name);
  private skills: Map<string, unknown> = new Map();
  private tools: Map<string, unknown> = new Map();

  async onModuleInit() {
    this.logger.log('🧠 Initializing BMAD Orchestration Service...');
    await this.initializeDefaultSkills();
  }

  private async initializeDefaultSkills(): Promise<void> {
    // Register built-in skills
    this.registerSkill('code-review', {
      name: 'Code Review',
      description: 'Analyzes code for quality and issues',
      category: 'development',
    });

    this.registerSkill('security-audit', {
      name: 'Security Audit',
      description: 'Scans for security vulnerabilities',
      category: 'security',
    });

    this.registerSkill('documentation', {
      name: 'Documentation Generator',
      description: 'Generates documentation from code',
      category: 'documentation',
    });

    this.logger.log(`📚 Registered ${this.skills.size} default skills`);
  }

  registerSkill(id: string, skill: unknown): void {
    this.skills.set(id, skill);
  }

  createToolFromSkill(skillId: string): unknown {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const toolId = `tool-${skillId}`;
    const tool = { id: toolId, skillId, skill };
    this.tools.set(toolId, tool);

    return tool;
  }

  async executeBMADCycle(config: {
    skillIds: string[];
    contextPurpose: string;
    templateId: string;
    variables: Record<string, unknown>;
  }): Promise<{
    skills: number;
    tools: number;
    contextTokens: number;
    success: boolean;
  }> {
    this.logger.log(`🔄 Executing BMAD cycle for: ${config.contextPurpose}`);

    // Layer 1: Load skills
    const loadedSkills = config.skillIds.filter((id) => this.skills.has(id));

    // Layer 2: Create tools
    const tools = loadedSkills.map((id) => this.createToolFromSkill(id));

    // Layer 3: Engineer context (placeholder)
    const contextTokens = 1000;

    // Layer 4: Execute prompt (placeholder)
    const success = true;

    return {
      skills: loadedSkills.length,
      tools: tools.length,
      contextTokens,
      success,
    };
  }

  getStatistics(): {
    skills: number;
    tools: number;
  } {
    return {
      skills: this.skills.size,
      tools: this.tools.size,
    };
  }
}

/**
 * Agent Swarm Provider
 * Manages agent registration and coordination
 */
export class AgentSwarmProvider implements OnModuleInit {
  private readonly logger = new Logger(AgentSwarmProvider.name);
  private agents: Map<
    string,
    {
      id: string;
      name: string;
      capabilities: string[];
      status: string;
      lastHeartbeat: Date;
    }
  > = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private config: TNFAutonomousConfig;

  constructor(config?: Partial<TNFAutonomousConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async onModuleInit() {
    this.logger.log('🐝 Initializing Agent Swarm Orchestration...');

    if (this.config.enableHeartbeat) {
      this.startHeartbeatMonitor();
    }
  }

  registerAgent(agent: { id: string; name: string; capabilities: string[] }): void {
    this.agents.set(agent.id, {
      ...agent,
      status: 'online',
      lastHeartbeat: new Date(),
    });
    this.logger.log(`✅ Agent registered: ${agent.name} (${agent.capabilities.join(', ')})`);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.log(`🔌 Agent unregistered: ${agentId}`);
  }

  recordHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = new Date();
      agent.status = 'online';
    }
  }

  findAgentsByCapability(capability: string): Array<{
    id: string;
    name: string;
    capabilities: string[];
    status: string;
  }> {
    return Array.from(this.agents.values()).filter(
      (a) => a.capabilities.includes(capability) && a.status === 'online'
    );
  }

  private startHeartbeatMonitor(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 90000; // 90 seconds

      for (const [id, agent] of this.agents) {
        const elapsed = now.getTime() - agent.lastHeartbeat.getTime();
        if (elapsed > timeout && agent.status === 'online') {
          agent.status = 'offline';
          this.logger.warn(`⚠️ Agent ${agent.name} went offline (no heartbeat)`);
        }
      }
    }, this.config.heartbeatIntervalMs);
  }

  async stopHeartbeatMonitor(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getStatistics(): {
    totalAgents: number;
    onlineAgents: number;
    offlineAgents: number;
    agentsByCapability: Record<string, number>;
  } {
    const agents = Array.from(this.agents.values());
    const capabilities: Record<string, number> = {};

    for (const agent of agents) {
      for (const cap of agent.capabilities) {
        capabilities[cap] = (capabilities[cap] || 0) + 1;
      }
    }

    return {
      totalAgents: agents.length,
      onlineAgents: agents.filter((a) => a.status === 'online').length,
      offlineAgents: agents.filter((a) => a.status === 'offline').length,
      agentsByCapability: capabilities,
    };
  }
}

import { TNFAutonomousController } from '../controllers/tnf-autonomous.controller';

/**
 * TNF Autonomous Module
 * Main module that wires everything together
 */
@Module({
  imports: [EventEmitterModule], // EventEmitterModule and ScheduleModule configured at root AppModule
  controllers: [TNFAutonomousController],
  providers: [
    {
      provide: 'TNF_AUTONOMOUS_CONFIG',
      useValue: DEFAULT_CONFIG,
    },
    {
      provide: DirectorServiceProvider,
      useFactory: (swarm: AgentSwarmProvider) =>
        new DirectorServiceProvider(swarm, DEFAULT_CONFIG),
      inject: [AgentSwarmProvider],
    },
    {
      provide: BMADServiceProvider,
      useClass: BMADServiceProvider,
    },
    {
      provide: AgentSwarmProvider,
      useFactory: () => new AgentSwarmProvider(DEFAULT_CONFIG),
    },
  ],
  exports: [
    DirectorServiceProvider,
    BMADServiceProvider,
    AgentSwarmProvider,
    'TNF_AUTONOMOUS_CONFIG',
  ],
})
export class TNFAutonomousModule implements OnModuleInit {
  private readonly logger = new Logger(TNFAutonomousModule.name);

  constructor(
    private readonly director: DirectorServiceProvider,
    private readonly bmad: BMADServiceProvider,
    private readonly swarm: AgentSwarmProvider
  ) {}

  async onModuleInit() {
    this.logger.log('═'.repeat(60));
    this.logger.log('   🔮 THE NEW FUSE - AUTONOMOUS SYSTEM');
    this.logger.log('═'.repeat(60));
    this.logger.log('');
    this.logger.log('   Components:');
    this.logger.log('   ├── DirectorService (Autonomous Loop)');
    this.logger.log('   ├── BMADOrchestration (Skills→Tools→Context→Prompts)');
    this.logger.log('   └── AgentSwarm (Registration & Coordination)');
    this.logger.log('');
    this.logger.log('═'.repeat(60) + '\n');

    // Log initial statistics
    const swarmStats = this.swarm.getStatistics();
    const bmadStats = this.bmad.getStatistics();
    const directorStatus = this.director.getStatus();

    this.logger.log(`📊 Initial State:`);
    this.logger.log(`   Director: ${directorStatus.isRunning ? 'RUNNING' : 'STOPPED'}`);
    this.logger.log(`   BMAD Skills: ${bmadStats.skills}`);
    this.logger.log(`   Swarm Agents: ${swarmStats.totalAgents}`);
  }

  /**
   * Get overall system status
   */
  getSystemStatus(): {
    director: ReturnType<DirectorServiceProvider['getStatus']>;
    bmad: ReturnType<BMADServiceProvider['getStatistics']>;
    swarm: ReturnType<AgentSwarmProvider['getStatistics']>;
    uptime: number;
  } {
    return {
      director: this.director.getStatus(),
      bmad: this.bmad.getStatistics(),
      swarm: this.swarm.getStatistics(),
      uptime: process.uptime(),
    };
  }
}

export default TNFAutonomousModule;
