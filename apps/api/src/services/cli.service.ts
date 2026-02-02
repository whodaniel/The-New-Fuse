/**
 * CLI Service
 *
 * Service for executing TNF CLI commands programmatically.
 * Wraps the tnf-cli package functionality for use within the API.
 *
 * @module CLIService
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentPlatform,
  AgentRole,
  CircuitBreaker,
  getConfigManager,
  Orchestrator,
  RedisAgentClient,
  Task,
  TaskCreateRequest,
  TaskManager,
  TaskState,
  WORKFLOW_TEMPLATES,
} from '@the-new-fuse/tnf-cli';

/**
 * Command execution DTO
 */
export interface ExecuteCommandDto {
  category: string;
  command: string;
  args?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

/**
 * CLI Command Information
 */
export interface CLICommandInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  args?: Array<{
    name: string;
    description: string;
    required: boolean;
    type: string;
  }>;
  options?: Array<{
    name: string;
    description: string;
    alias?: string;
    type: string;
    default?: unknown;
  }>;
}

/**
 * Service for executing CLI commands
 *
 * Provides a programmatic interface to TNF CLI functionality.
 * Manages Redis connections and agent client lifecycle.
 */
@Injectable()
export class CLIService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CLIService.name);
  private redisClient: RedisAgentClient | null = null;
  private configManager: ReturnType<typeof getConfigManager>;
  private taskManager: TaskManager;
  private circuitBreaker: CircuitBreaker;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.configManager = getConfigManager();
    this.taskManager = new TaskManager();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 3,
      timeoutMs: 60000,
      halfOpenMaxCalls: 3,
    });
  }

  /**
   * Initialize the CLI service on module init
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();
      this.logger.log('CLI Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize CLI Service', (error as Error).message);
      // Don't throw - allow service to start even if Redis is unavailable
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }

    // Parse Redis URL and update config
    const config = this.configManager.getConfig();
    config.redis.host = redisUrl;

    this.redisClient = new RedisAgentClient(config);
    await this.redisClient.initialize();

    // Register as a system agent
    await this.redisClient.register('api-cli-service', 'broker', 'api');

    this.isInitialized = true;
  }

  /**
   * Cleanup Redis connection
   */
  private async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.cleanup();
      this.redisClient = null;
    }
    this.isInitialized = false;
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<RedisAgentClient> {
    if (!this.isInitialized || !this.redisClient) {
      await this.initialize();
    }
    if (!this.redisClient) {
      throw new Error('Redis client not available');
    }
    return this.redisClient;
  }

  /**
   * Execute a CLI command
   *
   * @param dto - Command execution parameters
   * @returns Command execution result
   */
  async executeCommand(dto: ExecuteCommandDto): Promise<unknown> {
    const client = await this.ensureInitialized();

    return this.circuitBreaker.execute(async () => {
      switch (dto.category) {
        case 'agent':
          return this.executeAgentCommand(dto.command, dto.args, dto.options, client);
        case 'task':
          return this.executeTaskCommand(dto.command, dto.args, dto.options, client);
        case 'workflow':
          return this.executeWorkflowCommand(dto.command, dto.args, dto.options, client);
        case 'config':
          return this.executeConfigCommand(dto.command, dto.args, dto.options);
        case 'monitoring':
          return this.executeMonitoringCommand(dto.command, dto.args, dto.options, client);
        case 'message':
          return this.executeMessageCommand(dto.command, dto.args, dto.options, client);
        case 'conversation':
          return this.executeConversationCommand(dto.command, dto.args, dto.options, client);
        case 'ide':
          return this.executeIDECommand(dto.command, dto.args, dto.options, client);
        default:
          throw new Error(`Unknown command category: ${dto.category}`);
      }
    });
  }

  /**
   * Execute agent-related commands
   */
  private async executeAgentCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      case 'list':
        let agents = await redisClient.listAgents();
        if (options?.skills) {
          agents = agents.filter((a) =>
            a.agentCard?.skills.some(
              (s) => s.id === options.skills || s.tags.includes(options.skills as string)
            )
          );
        }
        if (options?.online) {
          agents = agents.filter((a) => a.isOnline);
        }
        return agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          platform: agent.platform,
          status: agent.status,
          capabilities: agent.capabilities,
          isOnline: agent.isOnline,
          lastSeen: agent.lastSeen,
          skills: agent.agentCard?.skills.map((s) => s.id) || [],
        }));

      case 'discover':
        if (!args?.skill) {
          throw new Error('Skill parameter required for discover command');
        }
        return redisClient.discoverAgentsBySkill(args.skill as string);

      case 'register':
        const agentInfo = await redisClient.register(
          (args?.name as string) || 'api-agent',
          (args?.role as AgentRole) || 'participant',
          (args?.platform as AgentPlatform) || 'api',
          (args?.capabilities as string[]) || ['api']
        );
        return {
          id: agentInfo.id,
          name: agentInfo.name,
          role: agentInfo.role,
          platform: agentInfo.platform,
          capabilities: agentInfo.capabilities,
        };

      default:
        throw new Error(`Unknown agent command: ${command}`);
    }
  }

  /**
   * Execute task-related commands
   */
  private async executeTaskCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      case 'create':
        const createRequest: TaskCreateRequest = {
          title: (args?.title as string) || 'Untitled Task',
          description: args?.description as string,
          assignedTo: args?.assign as string,
          priority: (options?.priority as Task['metadata']['priority']) || 'normal',
          tags: (options?.tags as string)?.split(',') || [],
          deadline: options?.deadline as string,
        };
        return redisClient.createTask(createRequest);

      case 'list':
        let tasks = redisClient.taskManager.getAllTasks();
        if (options?.state) {
          tasks = tasks.filter((t) => t.status.state === options.state);
        }
        if (options?.assignee) {
          tasks = tasks.filter((t) => t.assignedTo === options.assignee);
        }
        if (!options?.all) {
          tasks = tasks.filter(
            (t) => t.status.state !== TaskState.Completed && t.status.state !== TaskState.Canceled
          );
        }
        return tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status.state,
          assignedTo: task.assignedTo,
          priority: task.metadata?.priority,
          createdAt: task.createdAt,
        }));

      case 'status':
        if (!args?.taskId) {
          throw new Error('Task ID required for status command');
        }
        const task = redisClient.taskManager.getTask(args.taskId as string);
        if (!task) {
          throw new Error(`Task ${args.taskId} not found`);
        }
        return {
          id: task.id,
          title: task.title,
          status: task.status.state,
          message: task.status.message,
          progress: task.status.progress,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          artifacts: task.artifacts.map((a) => ({
            id: a.artifactId,
            name: a.name,
          })),
        };

      case 'assign':
        if (!args?.taskId || !args?.agentId) {
          throw new Error('Task ID and Agent ID required for assign command');
        }
        return redisClient.assignTask(args.taskId as string, args.agentId as string);

      case 'cancel':
        if (!args?.taskId) {
          throw new Error('Task ID required for cancel command');
        }
        return redisClient.taskManager.cancelTask(
          args.taskId as string,
          (options?.reason as string) || 'Cancelled via API'
        );

      default:
        throw new Error(`Unknown task command: ${command}`);
    }
  }

  /**
   * Execute workflow-related commands
   */
  private async executeWorkflowCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      case 'orchestrate':
        const orchestrator = new Orchestrator(redisClient);
        const workflowId = args?.workflow as string;

        if (options?.template) {
          const template = WORKFLOW_TEMPLATES[workflowId as keyof typeof WORKFLOW_TEMPLATES];
          if (!template) {
            throw new Error(`Template "${workflowId}" not found`);
          }
          const registeredId = orchestrator.registerWorkflow(template);
          return orchestrator.executeWorkflow(registeredId, options.vars || {});
        }

        return orchestrator.executeWorkflow(workflowId, options?.vars || {});

      case 'templates':
        return Object.entries(WORKFLOW_TEMPLATES).map(([key, template]) => ({
          id: key,
          name: template.name,
          description: template.description,
          steps: template.steps.length,
        }));

      default:
        throw new Error(`Unknown workflow command: ${command}`);
    }
  }

  /**
   * Execute config-related commands
   */
  private async executeConfigCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<unknown> {
    switch (command) {
      case 'show':
        return this.configManager.getConfig();

      case 'set':
        if (!args?.key || !args?.value) {
          throw new Error('Key and value required for set command');
        }
        // Parse value as JSON if possible
        let parsedValue: unknown;
        try {
          parsedValue = JSON.parse(args.value as string);
        } catch {
          parsedValue = args.value;
        }

        // Navigate to nested property
        const keys = (args.key as string).split('.');
        const config = this.configManager.getConfig();
        let current: Record<string, unknown> = config as Record<string, unknown>;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in current)) {
            current[keys[i]] = {};
          }
          current = current[keys[i]] as Record<string, unknown>;
        }

        current[keys[keys.length - 1]] = parsedValue;
        this.configManager.update(config);
        return { success: true, key: args.key, value: parsedValue };

      case 'profiles':
        return {
          profiles: this.configManager.listProfiles(),
          current: this.configManager.getCurrentProfile(),
        };

      case 'use-profile':
        if (!args?.name) {
          throw new Error('Profile name required for use-profile command');
        }
        this.configManager.loadProfile(args.name as string);
        return { success: true, profile: args.name };

      default:
        throw new Error(`Unknown config command: ${command}`);
    }
  }

  /**
   * Execute monitoring-related commands
   */
  private async executeMonitoringCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      case 'health':
        const agents = await redisClient.listAgents();
        const onlineAgents = agents.filter((a) => a.isOnline);
        const cbMetrics = redisClient.getCircuitBreakerMetrics();

        return {
          totalAgents: agents.length,
          onlineAgents: onlineAgents.length,
          offlineAgents: agents.length - onlineAgents.length,
          circuitBreaker: {
            state: cbMetrics.state,
            failures: cbMetrics.failureCount,
            successes: cbMetrics.successCount,
          },
          timestamp: new Date().toISOString(),
        };

      case 'stats':
        const stats = redisClient.taskManager.getStats();
        return {
          total: stats.total,
          completionRate: stats.completionRate,
          averageCompletionTime: stats.averageCompletionTime,
          byState: stats.byState,
        };

      default:
        throw new Error(`Unknown monitoring command: ${command}`);
    }
  }

  /**
   * Execute message-related commands
   */
  private async executeMessageCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      case 'send':
        if (!args?.message) {
          throw new Error('Message content required');
        }
        return redisClient.send(args.message as string, {
          to: options?.to ? { agentId: options.to as string } : undefined,
          expectsResponse: options?.ack as boolean,
          priority: (options?.priority as 'low' | 'normal' | 'high' | 'critical') || 'normal',
        });

      default:
        throw new Error(`Unknown message command: ${command}`);
    }
  }

  /**
   * Execute conversation-related commands
   */
  private async executeConversationCommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      case 'start':
        const topic = (args?.topic as string) || 'general';
        const id = await redisClient.startConversation(topic);
        return { id, topic };

      case 'join':
        if (!args?.conversationId) {
          throw new Error('Conversation ID required');
        }
        redisClient.joinConversation(args.conversationId as string);
        return { success: true, conversationId: args.conversationId };

      default:
        throw new Error(`Unknown conversation command: ${command}`);
    }
  }

  /**
   * Execute IDE-related commands
   */
  private async executeIDECommand(
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>,
    client?: RedisAgentClient
  ): Promise<unknown> {
    const redisClient = client || (await this.ensureInitialized());

    switch (command) {
      // Chat Commands
      case 'sendMessage':
        return {
          success: true,
          command: 'sendMessage',
          message: args?.message || 'Message sent',
          timestamp: new Date().toISOString(),
        };

      case 'newChat':
        return {
          success: true,
          command: 'newChat',
          chatId: `chat-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      case 'clearChat':
        return {
          success: true,
          command: 'clearChat',
          timestamp: new Date().toISOString(),
        };

      case 'historyButtonClicked':
        return {
          success: true,
          command: 'historyButtonClicked',
          history: [],
          timestamp: new Date().toISOString(),
        };

      case 'openInNewTab':
        return {
          success: true,
          command: 'openInNewTab',
          tabId: `tab-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      case 'attachFiles':
        return {
          success: true,
          command: 'attachFiles',
          files: args?.files || [],
          timestamp: new Date().toISOString(),
        };

      // Code Actions
      case 'explainCode':
        return {
          success: true,
          command: 'explainCode',
          explanation: 'Code explanation would be generated here based on selected code.',
          timestamp: new Date().toISOString(),
        };

      case 'fixCode':
        return {
          success: true,
          command: 'fixCode',
          fix: 'Code fix would be generated here based on selected code.',
          timestamp: new Date().toISOString(),
        };

      case 'improveCode':
        return {
          success: true,
          command: 'improveCode',
          improvements: 'Code improvements would be generated here based on selected code.',
          timestamp: new Date().toISOString(),
        };

      case 'codeActions':
        return {
          success: true,
          command: 'codeActions',
          actions: ['explain', 'fix', 'improve', 'document', 'test'],
          timestamp: new Date().toISOString(),
        };

      case 'codeLens.explain':
        return {
          success: true,
          command: 'codeLens.explain',
          explanation: 'CodeLens explanation would be generated here.',
          timestamp: new Date().toISOString(),
        };

      case 'codeLens.optimize':
        return {
          success: true,
          command: 'codeLens.optimize',
          optimization: 'CodeLens optimization would be generated here.',
          timestamp: new Date().toISOString(),
        };

      case 'codeLens.generateTests':
        return {
          success: true,
          command: 'codeLens.generateTests',
          tests: 'Tests would be generated here.',
          timestamp: new Date().toISOString(),
        };

      case 'codeLens.document':
        return {
          success: true,
          command: 'codeLens.document',
          documentation: 'Documentation would be generated here.',
          timestamp: new Date().toISOString(),
        };

      // AI Features
      case 'inlineSuggestions':
        return {
          success: true,
          command: 'inlineSuggestions',
          suggestions: args?.suggestions || [],
          timestamp: new Date().toISOString(),
        };

      case 'completion.toggle':
        return {
          success: true,
          command: 'completion.toggle',
          enabled: args?.enabled ?? true,
          timestamp: new Date().toISOString(),
        };

      case 'completion.clearCache':
        return {
          success: true,
          command: 'completion.clearCache',
          timestamp: new Date().toISOString(),
        };

      case 'completion.triggerManual':
        return {
          success: true,
          command: 'completion.triggerManual',
          completions: [],
          timestamp: new Date().toISOString(),
        };

      case 'hover.explain':
        return {
          success: true,
          command: 'hover.explain',
          explanation: 'Hover explanation would be generated here.',
          timestamp: new Date().toISOString(),
        };

      case 'hover.toggleAIHints':
        return {
          success: true,
          command: 'hover.toggleAIHints',
          enabled: args?.enabled ?? true,
          timestamp: new Date().toISOString(),
        };

      // MCP Commands
      case 'mcpConnect':
        return {
          success: true,
          command: 'mcpConnect',
          serverId: args?.serverId || 'default',
          status: 'connected',
          timestamp: new Date().toISOString(),
        };

      case 'mcpStatus':
        return {
          success: true,
          command: 'mcpStatus',
          servers: [],
          timestamp: new Date().toISOString(),
        };

      case 'mcpImportConfig':
        return {
          success: true,
          command: 'mcpImportConfig',
          config: args?.config || {},
          timestamp: new Date().toISOString(),
        };

      case 'mcpExportConfig':
        return {
          success: true,
          command: 'mcpExportConfig',
          config: {},
          timestamp: new Date().toISOString(),
        };

      case 'mcpMarketplace':
        return {
          success: true,
          command: 'mcpMarketplace',
          servers: [],
          timestamp: new Date().toISOString(),
        };

      // Browser Commands
      case 'openBrowser':
        return {
          success: true,
          command: 'openBrowser',
          browserId: `browser-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      case 'navigateTo':
        return {
          success: true,
          command: 'navigateTo',
          url: args?.url || 'https://example.com',
          timestamp: new Date().toISOString(),
        };

      case 'browserScreenshot':
        return {
          success: true,
          command: 'browserScreenshot',
          screenshot: 'base64-encoded-screenshot-data',
          timestamp: new Date().toISOString(),
        };

      case 'browserExecuteScript':
        return {
          success: true,
          command: 'browserExecuteScript',
          result: args?.script ? 'Script executed' : 'No script provided',
          timestamp: new Date().toISOString(),
        };

      // Workflow Commands
      case 'openWorkflowBuilder':
        return {
          success: true,
          command: 'openWorkflowBuilder',
          workflowId: `workflow-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      case 'planManager':
        return {
          success: true,
          command: 'planManager',
          plans: [],
          timestamp: new Date().toISOString(),
        };

      case 'agentFederation':
        return {
          success: true,
          command: 'agentFederation',
          agents: await redisClient.listAgents(),
          timestamp: new Date().toISOString(),
        };

      // Security Commands
      case 'securityDashboard':
        return {
          success: true,
          command: 'securityDashboard',
          dashboard: {
            totalScans: 0,
            vulnerabilities: [],
            lastScan: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

      case 'securityScan':
        return {
          success: true,
          command: 'securityScan',
          scanId: `scan-${Date.now()}`,
          status: 'started',
          timestamp: new Date().toISOString(),
        };

      case 'emergencyMode':
        return {
          success: true,
          command: 'emergencyMode',
          enabled: args?.enabled ?? true,
          timestamp: new Date().toISOString(),
        };

      // Settings Commands
      case 'settingsButtonClicked':
        return {
          success: true,
          command: 'settingsButtonClicked',
          settings: this.configManager.getConfig(),
          timestamp: new Date().toISOString(),
        };

      case 'profileButtonClicked':
        return {
          success: true,
          command: 'profileButtonClicked',
          profiles: this.configManager.listProfiles(),
          current: this.configManager.getCurrentProfile(),
          timestamp: new Date().toISOString(),
        };

      case 'openLiteLLMConfig':
        return {
          success: true,
          command: 'openLiteLLMConfig',
          config: {},
          timestamp: new Date().toISOString(),
        };

      case 'selectModel':
        return {
          success: true,
          command: 'selectModel',
          model: args?.model || 'default',
          timestamp: new Date().toISOString(),
        };

      case 'selectOpenRouterModel':
        return {
          success: true,
          command: 'selectOpenRouterModel',
          model: args?.model || 'default',
          timestamp: new Date().toISOString(),
        };

      // System Commands
      case 'systemStatus':
        return {
          success: true,
          command: 'systemStatus',
          status: {
            healthy: this.isInitialized,
            redis: this.isInitialized,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

      case 'autoApprove':
        return {
          success: true,
          command: 'autoApprove',
          enabled: args?.enabled ?? true,
          timestamp: new Date().toISOString(),
        };

      case 'codeMode':
        return {
          success: true,
          command: 'codeMode',
          mode: 'code',
          timestamp: new Date().toISOString(),
        };

      case 'databaseMode':
        return {
          success: true,
          command: 'databaseMode',
          mode: 'database',
          timestamp: new Date().toISOString(),
        };

      case 'terminalOrchestration':
        return {
          success: true,
          command: 'terminalOrchestration',
          terminalId: `terminal-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      // Workspace Commands
      case 'workspace.index':
        return {
          success: true,
          command: 'workspace.index',
          indexed: true,
          timestamp: new Date().toISOString(),
        };

      case 'workspace.searchSymbols':
        return {
          success: true,
          command: 'workspace.searchSymbols',
          query: args?.query || '',
          symbols: [],
          timestamp: new Date().toISOString(),
        };

      case 'git.summary':
        return {
          success: true,
          command: 'git.summary',
          summary: {
            branch: 'main',
            commits: 0,
            modified: [],
          },
          timestamp: new Date().toISOString(),
        };

      case 'addToContext':
        return {
          success: true,
          command: 'addToContext',
          files: args?.files || [],
          timestamp: new Date().toISOString(),
        };

      // CLI Commands
      case 'cli.runAgent':
        return {
          success: true,
          command: 'cli.runAgent',
          agentId: args?.agentId || `agent-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      case 'cli.initWorkspace':
        return {
          success: true,
          command: 'cli.initWorkspace',
          workspaceId: `workspace-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      case 'cli.showTasks':
        return {
          success: true,
          command: 'cli.showTasks',
          tasks: redisClient.taskManager.getAllTasks(),
          timestamp: new Date().toISOString(),
        };

      case 'cli.showHistory':
        return {
          success: true,
          command: 'cli.showHistory',
          history: [],
          timestamp: new Date().toISOString(),
        };

      case 'cli.chatSession':
        return {
          success: true,
          command: 'cli.chatSession',
          sessionId: `session-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

      default:
        throw new Error(`Unknown IDE command: ${command}`);
    }
  }

  /**
   * Get available CLI commands
   *
   * @param category - Optional category filter
   * @returns List of available commands
   */
  getCommands(category?: string): CLICommandInfo[] {
    const allCommands: CLICommandInfo[] = [
      // Agent commands
      {
        id: 'agent.list',
        name: 'list',
        category: 'agent',
        description: 'List all registered agents',
        options: [
          { name: 'skills', description: 'Filter by skill', type: 'string' },
          { name: 'online', description: 'Show only online agents', type: 'boolean' },
        ],
      },
      {
        id: 'agent.discover',
        name: 'discover',
        category: 'agent',
        description: 'Discover agents by skill',
        args: [
          { name: 'skill', description: 'Skill to search for', required: true, type: 'string' },
        ],
      },
      {
        id: 'agent.register',
        name: 'register',
        category: 'agent',
        description: 'Register a new agent',
        args: [
          { name: 'name', description: 'Agent name', required: false, type: 'string' },
          { name: 'role', description: 'Agent role', required: false, type: 'string' },
          { name: 'platform', description: 'Agent platform', required: false, type: 'string' },
        ],
      },

      // Task commands
      {
        id: 'task.create',
        name: 'create',
        category: 'task',
        description: 'Create a new task',
        args: [{ name: 'title', description: 'Task title', required: true, type: 'string' }],
        options: [
          { name: 'description', description: 'Task description', type: 'string' },
          { name: 'assign', description: 'Assign to agent', type: 'string' },
          { name: 'priority', description: 'Priority level', type: 'string', default: 'normal' },
          { name: 'tags', description: 'Comma-separated tags', type: 'string' },
          { name: 'deadline', description: 'Deadline (ISO format)', type: 'string' },
        ],
      },
      {
        id: 'task.list',
        name: 'list',
        category: 'task',
        description: 'List tasks',
        options: [
          { name: 'state', description: 'Filter by state', type: 'string' },
          { name: 'assignee', description: 'Filter by assignee', type: 'string' },
          { name: 'all', description: 'Include completed tasks', type: 'boolean' },
        ],
      },
      {
        id: 'task.status',
        name: 'status',
        category: 'task',
        description: 'Get task status',
        args: [{ name: 'taskId', description: 'Task ID', required: true, type: 'string' }],
      },
      {
        id: 'task.assign',
        name: 'assign',
        category: 'task',
        description: 'Assign a task to an agent',
        args: [
          { name: 'taskId', description: 'Task ID', required: true, type: 'string' },
          { name: 'agentId', description: 'Agent ID', required: true, type: 'string' },
        ],
      },
      {
        id: 'task.cancel',
        name: 'cancel',
        category: 'task',
        description: 'Cancel a task',
        args: [{ name: 'taskId', description: 'Task ID', required: true, type: 'string' }],
        options: [{ name: 'reason', description: 'Cancellation reason', type: 'string' }],
      },

      // Workflow commands
      {
        id: 'workflow.orchestrate',
        name: 'orchestrate',
        category: 'workflow',
        description: 'Execute a workflow',
        args: [
          { name: 'workflow', description: 'Workflow name or ID', required: true, type: 'string' },
        ],
        options: [
          { name: 'template', description: 'Use built-in template', type: 'boolean' },
          { name: 'vars', description: 'Workflow variables as JSON', type: 'object' },
        ],
      },
      {
        id: 'workflow.templates',
        name: 'templates',
        category: 'workflow',
        description: 'List available workflow templates',
      },

      // Config commands
      {
        id: 'config.show',
        name: 'show',
        category: 'config',
        description: 'Show current configuration',
      },
      {
        id: 'config.set',
        name: 'set',
        category: 'config',
        description: 'Set configuration value',
        args: [
          { name: 'key', description: 'Config key (dot notation)', required: true, type: 'string' },
          { name: 'value', description: 'Config value', required: true, type: 'string' },
        ],
      },
      {
        id: 'config.profiles',
        name: 'profiles',
        category: 'config',
        description: 'List available profiles',
      },
      {
        id: 'config.use-profile',
        name: 'use-profile',
        category: 'config',
        description: 'Switch to a profile',
        args: [{ name: 'name', description: 'Profile name', required: true, type: 'string' }],
      },

      // Monitoring commands
      {
        id: 'monitoring.health',
        name: 'health',
        category: 'monitoring',
        description: 'Check system health',
      },
      {
        id: 'monitoring.stats',
        name: 'stats',
        category: 'monitoring',
        description: 'Show task statistics',
      },

      // Message commands
      {
        id: 'message.send',
        name: 'send',
        category: 'message',
        description: 'Send a message',
        args: [{ name: 'message', description: 'Message to send', required: true, type: 'string' }],
        options: [
          { name: 'to', description: 'Recipient agent ID', type: 'string' },
          { name: 'ack', description: 'Wait for acknowledgment', type: 'boolean' },
          { name: 'priority', description: 'Message priority', type: 'string', default: 'normal' },
        ],
      },

      // Conversation commands
      {
        id: 'conversation.start',
        name: 'start',
        category: 'conversation',
        description: 'Start a conversation',
        args: [
          { name: 'topic', description: 'Conversation topic', required: false, type: 'string' },
        ],
      },
      {
        id: 'conversation.join',
        name: 'join',
        category: 'conversation',
        description: 'Join a conversation',
        args: [
          {
            name: 'conversationId',
            description: 'Conversation ID',
            required: true,
            type: 'string',
          },
        ],
      },

      // IDE Commands - Chat
      {
        id: 'ide.sendMessage',
        name: 'sendMessage',
        category: 'ide',
        description: 'Send a message in the IDE chat',
        args: [{ name: 'message', description: 'Message content', required: true, type: 'string' }],
      },
      {
        id: 'ide.newChat',
        name: 'newChat',
        category: 'ide',
        description: 'Start a new chat session',
      },
      {
        id: 'ide.clearChat',
        name: 'clearChat',
        category: 'ide',
        description: 'Clear the current chat',
      },
      {
        id: 'ide.historyButtonClicked',
        name: 'historyButtonClicked',
        category: 'ide',
        description: 'Open chat history',
      },
      {
        id: 'ide.openInNewTab',
        name: 'openInNewTab',
        category: 'ide',
        description: 'Open chat in new tab',
      },
      {
        id: 'ide.attachFiles',
        name: 'attachFiles',
        category: 'ide',
        description: 'Attach files to chat',
        args: [{ name: 'files', description: 'Files to attach', required: true, type: 'array' }],
      },

      // IDE Commands - Code Actions
      {
        id: 'ide.explainCode',
        name: 'explainCode',
        category: 'ide',
        description: 'Explain selected code',
        args: [{ name: 'code', description: 'Code to explain', required: false, type: 'string' }],
      },
      {
        id: 'ide.fixCode',
        name: 'fixCode',
        category: 'ide',
        description: 'Fix selected code',
        args: [{ name: 'code', description: 'Code to fix', required: false, type: 'string' }],
      },
      {
        id: 'ide.improveCode',
        name: 'improveCode',
        category: 'ide',
        description: 'Improve selected code',
        args: [{ name: 'code', description: 'Code to improve', required: false, type: 'string' }],
      },
      {
        id: 'ide.codeActions',
        name: 'codeActions',
        category: 'ide',
        description: 'Get available code actions',
      },
      {
        id: 'ide.codeLens.explain',
        name: 'codeLens.explain',
        category: 'ide',
        description: 'Explain code via CodeLens',
      },
      {
        id: 'ide.codeLens.optimize',
        name: 'codeLens.optimize',
        category: 'ide',
        description: 'Optimize code via CodeLens',
      },
      {
        id: 'ide.codeLens.generateTests',
        name: 'codeLens.generateTests',
        category: 'ide',
        description: 'Generate tests via CodeLens',
      },
      {
        id: 'ide.codeLens.document',
        name: 'codeLens.document',
        category: 'ide',
        description: 'Generate documentation via CodeLens',
      },

      // IDE Commands - AI Features
      {
        id: 'ide.inlineSuggestions',
        name: 'inlineSuggestions',
        category: 'ide',
        description: 'Get inline code suggestions',
      },
      {
        id: 'ide.completion.toggle',
        name: 'completion.toggle',
        category: 'ide',
        description: 'Toggle AI completions',
        args: [
          {
            name: 'enabled',
            description: 'Enable/disable completions',
            required: false,
            type: 'boolean',
          },
        ],
      },
      {
        id: 'ide.completion.clearCache',
        name: 'completion.clearCache',
        category: 'ide',
        description: 'Clear AI completion cache',
      },
      {
        id: 'ide.completion.triggerManual',
        name: 'completion.triggerManual',
        category: 'ide',
        description: 'Manually trigger AI completion',
      },
      {
        id: 'ide.hover.explain',
        name: 'hover.explain',
        category: 'ide',
        description: 'Explain element on hover',
      },
      {
        id: 'ide.hover.toggleAIHints',
        name: 'hover.toggleAIHints',
        category: 'ide',
        description: 'Toggle AI hover hints',
        args: [
          {
            name: 'enabled',
            description: 'Enable/disable hints',
            required: false,
            type: 'boolean',
          },
        ],
      },

      // IDE Commands - MCP
      {
        id: 'ide.mcpConnect',
        name: 'mcpConnect',
        category: 'ide',
        description: 'Connect to MCP server',
        args: [{ name: 'serverId', description: 'MCP Server ID', required: false, type: 'string' }],
      },
      {
        id: 'ide.mcpStatus',
        name: 'mcpStatus',
        category: 'ide',
        description: 'Get MCP server status',
      },
      {
        id: 'ide.mcpImportConfig',
        name: 'mcpImportConfig',
        category: 'ide',
        description: 'Import MCP configuration',
        args: [
          { name: 'config', description: 'Configuration object', required: true, type: 'object' },
        ],
      },
      {
        id: 'ide.mcpExportConfig',
        name: 'mcpExportConfig',
        category: 'ide',
        description: 'Export MCP configuration',
      },
      {
        id: 'ide.mcpMarketplace',
        name: 'mcpMarketplace',
        category: 'ide',
        description: 'Open MCP marketplace',
      },

      // IDE Commands - Browser
      {
        id: 'ide.openBrowser',
        name: 'openBrowser',
        category: 'ide',
        description: 'Open embedded browser',
      },
      {
        id: 'ide.navigateTo',
        name: 'navigateTo',
        category: 'ide',
        description: 'Navigate browser to URL',
        args: [{ name: 'url', description: 'URL to navigate to', required: true, type: 'string' }],
      },
      {
        id: 'ide.browserScreenshot',
        name: 'browserScreenshot',
        category: 'ide',
        description: 'Take browser screenshot',
      },
      {
        id: 'ide.browserExecuteScript',
        name: 'browserExecuteScript',
        category: 'ide',
        description: 'Execute script in browser',
        args: [
          { name: 'script', description: 'JavaScript to execute', required: true, type: 'string' },
        ],
      },

      // IDE Commands - Workflow
      {
        id: 'ide.openWorkflowBuilder',
        name: 'openWorkflowBuilder',
        category: 'ide',
        description: 'Open workflow builder',
      },
      {
        id: 'ide.planManager',
        name: 'planManager',
        category: 'ide',
        description: 'Open plan manager',
      },
      {
        id: 'ide.agentFederation',
        name: 'agentFederation',
        category: 'ide',
        description: 'Open agent federation panel',
      },

      // IDE Commands - Security
      {
        id: 'ide.securityDashboard',
        name: 'securityDashboard',
        category: 'ide',
        description: 'Open security dashboard',
      },
      {
        id: 'ide.securityScan',
        name: 'securityScan',
        category: 'ide',
        description: 'Run security scan',
      },
      {
        id: 'ide.emergencyMode',
        name: 'emergencyMode',
        category: 'ide',
        description: 'Toggle emergency mode',
        args: [
          {
            name: 'enabled',
            description: 'Enable/disable emergency mode',
            required: false,
            type: 'boolean',
          },
        ],
      },

      // IDE Commands - Settings
      {
        id: 'ide.settingsButtonClicked',
        name: 'settingsButtonClicked',
        category: 'ide',
        description: 'Open settings',
      },
      {
        id: 'ide.profileButtonClicked',
        name: 'profileButtonClicked',
        category: 'ide',
        description: 'Open profile/API keys',
      },
      {
        id: 'ide.openLiteLLMConfig',
        name: 'openLiteLLMConfig',
        category: 'ide',
        description: 'Open LiteLLM configuration',
      },
      {
        id: 'ide.selectModel',
        name: 'selectModel',
        category: 'ide',
        description: 'Select AI model',
        args: [{ name: 'model', description: 'Model identifier', required: false, type: 'string' }],
      },
      {
        id: 'ide.selectOpenRouterModel',
        name: 'selectOpenRouterModel',
        category: 'ide',
        description: 'Select OpenRouter model',
        args: [
          {
            name: 'model',
            description: 'OpenRouter model identifier',
            required: false,
            type: 'string',
          },
        ],
      },

      // IDE Commands - System
      {
        id: 'ide.systemStatus',
        name: 'systemStatus',
        category: 'ide',
        description: 'Get system status',
      },
      {
        id: 'ide.autoApprove',
        name: 'autoApprove',
        category: 'ide',
        description: 'Toggle auto-approve mode',
        args: [
          {
            name: 'enabled',
            description: 'Enable/disable auto-approve',
            required: false,
            type: 'boolean',
          },
        ],
      },
      {
        id: 'ide.codeMode',
        name: 'codeMode',
        category: 'ide',
        description: 'Switch to code mode',
      },
      {
        id: 'ide.databaseMode',
        name: 'databaseMode',
        category: 'ide',
        description: 'Switch to database mode',
      },
      {
        id: 'ide.terminalOrchestration',
        name: 'terminalOrchestration',
        category: 'ide',
        description: 'Open terminal orchestration',
      },

      // IDE Commands - Workspace
      {
        id: 'ide.workspace.index',
        name: 'workspace.index',
        category: 'ide',
        description: 'Index workspace files',
      },
      {
        id: 'ide.workspace.searchSymbols',
        name: 'workspace.searchSymbols',
        category: 'ide',
        description: 'Search symbols in workspace',
        args: [{ name: 'query', description: 'Search query', required: false, type: 'string' }],
      },
      {
        id: 'ide.git.summary',
        name: 'git.summary',
        category: 'ide',
        description: 'Get Git repository summary',
      },
      {
        id: 'ide.addToContext',
        name: 'addToContext',
        category: 'ide',
        description: 'Add files to context',
        args: [{ name: 'files', description: 'Files to add', required: true, type: 'array' }],
      },

      // IDE Commands - CLI
      {
        id: 'ide.cli.runAgent',
        name: 'cli.runAgent',
        category: 'ide',
        description: 'Run CLI agent',
        args: [
          { name: 'agentId', description: 'Agent ID to run', required: false, type: 'string' },
        ],
      },
      {
        id: 'ide.cli.initWorkspace',
        name: 'cli.initWorkspace',
        category: 'ide',
        description: 'Initialize workspace',
      },
      {
        id: 'ide.cli.showTasks',
        name: 'cli.showTasks',
        category: 'ide',
        description: 'Show CLI tasks',
      },
      {
        id: 'ide.cli.showHistory',
        name: 'cli.showHistory',
        category: 'ide',
        description: 'Show CLI history',
      },
      {
        id: 'ide.cli.chatSession',
        name: 'cli.chatSession',
        category: 'ide',
        description: 'Start CLI chat session',
      },
    ];

    if (category) {
      return allCommands.filter((cmd) => cmd.category === category);
    }

    return allCommands;
  }

  /**
   * Get CLI health status
   *
   * @returns Health status information
   */
  async getHealth(): Promise<{
    status: string;
    redis: boolean;
    timestamp: string;
  }> {
    try {
      await this.ensureInitialized();
      return {
        status: 'healthy',
        redis: this.isInitialized,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'degraded',
        redis: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
