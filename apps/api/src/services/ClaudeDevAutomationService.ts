import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from '@nestjs/config';

export interface ClaudeDevAgent {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  template: string;
  configuration: ClaudeDevConfiguration;
  status: 'active' | 'inactive' | 'error' | 'initializing';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  permissions: ClaudeDevPermissions;
  health: {
    lastHealthCheck: Date;
    status: 'healthy' | 'unhealthy' | 'unknown';
    errorCount: number;
    uptime: number;
  };
}

export interface ClaudeDevConfiguration {
  autoApprove: boolean;
  maxFileOperations: number;
  allowedDirectories: string[];
  taskTimeout: number;
  concurrentTasks: number;
  integrations: {
    workspace: boolean;
    terminal: boolean;
    browser: boolean;
    vscode: boolean;
  };
  capabilities: {
    fileOperations: boolean;
    codeAnalysis: boolean;
    terminalAccess: boolean;
    webBrowsing: boolean;
    imageProcessing: boolean;
  };
  automationLevel: 'manual' | 'semi-auto' | 'auto';
  notifications: {
    onTaskStart: boolean;
    onTaskComplete: boolean;
    onError: boolean;
    onApprovalRequired: boolean;
  };
}

export interface ClaudeDevPermissions {
  canCreateFiles: boolean;
  canDeleteFiles: boolean;
  canModifyFiles: boolean;
  canExecuteTerminal: boolean;
  canBrowseWeb: boolean;
  canAccessWorkspace: boolean;
  allowedFileTypes: string[];
  restrictedPaths: string[];
  maxFileSize: number;
}

export interface ClaudeDevTask {
  id: string;
  agentId: string;
  tenantId: string;
  type: 'code_review' | 'project_setup' | 'debug' | 'documentation' | 'test' | 'refactor' | 'deploy' | 'security' | 'analysis' | 'ui_ux';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'approval_required';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  parameters: Record<string, any>;
  progress: {
    percentage: number;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    estimatedTimeRemaining: number;
  };
  result?: {
    success: boolean;
    output: any;
    files: string[];
    metrics: Record<string, number>;
    recommendations: string[];
  };
  error?: {
    message: string;
    code: string;
    details: any;
    timestamp: Date;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export interface ClaudeDevStatistics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  successRate: number;
  resourceUsage: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
}

@Injectable()
export class ClaudeDevAutomationService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClaudeDevAutomationService.name);
  private agents: Map<string, ClaudeDevAgent> = new Map();
  private tasks: Map<string, ClaudeDevTask> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
  ) {
    super();
    this.setupEventListeners();
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing Claude Dev Automation Service...');
      
      await this.startHealthChecks();
      await this.startMetricsCollection();
      
      this.initialized = true;
      this.emit('service:initialized', {
        timestamp: new Date(),
        agentCount: this.agents.size,
        taskCount: this.tasks.size,
      });
      
      this.logger.log('Claude Dev Automation Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Claude Dev Automation Service', error);
      this.emit('service:error', { error, timestamp: new Date() });
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down Claude Dev Automation Service...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    this.removeAllListeners();
    this.logger.log('Claude Dev Automation Service shut down successfully');
  }

  // Agent Management
  async createAgent(tenantId: string, agentData: Partial<ClaudeDevAgent>): Promise<ClaudeDevAgent> {
    try {
      const agentId = this.generateId('agent');
      const now = new Date();
      
      const agent: ClaudeDevAgent = {
        id: agentId,
        tenantId,
        name: agentData.name || `Claude Dev Agent ${agentId}`,
        description: agentData.description || 'Automated coding assistant',
        template: agentData.template || 'general',
        configuration: this.getDefaultConfiguration(agentData.configuration),
        status: 'initializing',
        createdAt: now,
        updatedAt: now,
        metadata: agentData.metadata || {},
        permissions: this.getDefaultPermissions(agentData.permissions),
        health: {
          lastHealthCheck: now,
          status: 'unknown',
          errorCount: 0,
          uptime: 0,
        },
      };

      await this.validateAgentConfiguration(agent);
      this.agents.set(agentId, agent);
      await this.initializeAgent(agent);
      
      this.emit('agent:created', { agent, timestamp: new Date() });
      this.logger.log(`Created Claude Dev agent: ${agentId} for tenant: ${tenantId}`);
      
      return agent;
    } catch (error) {
      this.logger.error('Failed to create Claude Dev agent', error);
      throw error;
    }
  }

  async getAgent(agentId: string, tenantId: string): Promise<ClaudeDevAgent | undefined> {
    const agent = this.agents.get(agentId);
    return agent && agent.tenantId === tenantId ? agent : undefined;
  }

  async getAgentsByTenant(tenantId: string): Promise<ClaudeDevAgent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.tenantId === tenantId);
  }

  // Task Management
  async executeTask(agentId: string, tenantId: string, taskData: Partial<ClaudeDevTask>): Promise<ClaudeDevTask> {
    try {
      const agent = await this.getAgent(agentId, tenantId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found for tenant ${tenantId}`);
      }

      if (agent.status !== 'active') {
        throw new Error(`Agent ${agentId} is not active (status: ${agent.status})`);
      }

      const taskId = this.generateId('task');
      const now = new Date();

      const task: ClaudeDevTask = {
        id: taskId,
        agentId,
        tenantId,
        type: taskData.type || 'code_review',
        status: 'pending',
        priority: taskData.priority || 'medium',
        description: taskData.description || 'Automated task',
        parameters: taskData.parameters || {},
        progress: {
          percentage: 0,
          currentStep: 'Initializing',
          totalSteps: 1,
          completedSteps: 0,
          estimatedTimeRemaining: 0,
        },
        createdAt: now,
        metadata: taskData.metadata || {},
      };

      this.tasks.set(taskId, task);
      this.executeTaskAsync(task, agent);

      this.emit('task:created', { task, agent, timestamp: new Date() });
      this.logger.log(`Created task ${taskId} for agent ${agentId}`);

      return task;
    } catch (error) {
      this.logger.error('Failed to create task', error);
      throw error;
    }
  }

  async getStatistics(tenantId?: string): Promise<ClaudeDevStatistics> {
    const agents = tenantId 
      ? Array.from(this.agents.values()).filter(a => a.tenantId === tenantId)
      : Array.from(this.agents.values());
    
    const tasks = tenantId
      ? Array.from(this.tasks.values()).filter(t => t.tenantId === tenantId)
      : Array.from(this.tasks.values());

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const failedTasks = tasks.filter(t => t.status === 'failed');

    const avgDuration = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const duration = task.completedAt && task.startedAt 
            ? task.completedAt.getTime() - task.startedAt.getTime()
            : 0;
          return sum + duration;
        }, 0) / completedTasks.length
      : 0;

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageTaskDuration: avgDuration,
      successRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      resourceUsage: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkUsage: Math.random() * 100,
      },
    };
  }

  async getHealthStatus(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    const stats = await this.getStatistics();
    const unhealthyAgents = Array.from(this.agents.values()).filter(a => a.health.status === 'unhealthy');
    
    const status = unhealthyAgents.length === 0 && this.initialized ? 'healthy' : 'unhealthy';
    
    return {
      status,
      details: {
        initialized: this.initialized,
        totalAgents: stats.totalAgents,
        activeAgents: stats.activeAgents,
        unhealthyAgents: unhealthyAgents.length,
        averageSuccessRate: stats.successRate,
        resourceUsage: stats.resourceUsage,
      },
    };
  }

  // Private Methods
  private setupEventListeners(): void {
    this.on('agent:created', this.handleAgentCreated.bind(this));
    this.on('task:started', this.handleTaskStarted.bind(this));
    this.on('task:completed', this.handleTaskCompleted.bind(this));
    this.on('task:failed', this.handleTaskFailed.bind(this));
  }

  private async executeTaskAsync(task: ClaudeDevTask, agent: ClaudeDevAgent): Promise<void> {
    try {
      task.status = 'running';
      task.startedAt = new Date();
      this.emit('task:started', { task, agent, timestamp: new Date() });

      const result = await this.performTaskExecution(task, agent);

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      task.progress.percentage = 100;
      task.progress.currentStep = 'Completed';

      this.emit('task:completed', { task, agent, result, timestamp: new Date() });
    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error,
        timestamp: new Date(),
      };
      this.emit('task:failed', { task, agent, error, timestamp: new Date() });
    }
  }

  private async performTaskExecution(task: ClaudeDevTask, agent: ClaudeDevAgent): Promise<any> {
    const mockResults = {
      code_review: {
        success: true,
        output: 'Code review completed successfully',
        files: ['src/example.ts'],
        metrics: { linesReviewed: 250, issuesFound: 3 },
        recommendations: ['Add type annotations', 'Improve error handling'],
      },
      project_setup: {
        success: true,
        output: 'Project setup completed',
        files: ['package.json', 'tsconfig.json', 'src/index.ts'],
        metrics: { filesCreated: 15, dependenciesInstalled: 8 },
        recommendations: ['Configure ESLint', 'Add pre-commit hooks'],
      },
    };

    await new Promise(resolve => setTimeout(resolve, 2000));
    return mockResults[task.type] || mockResults.code_review;
  }

  private getDefaultConfiguration(provided?: Partial<ClaudeDevConfiguration>): ClaudeDevConfiguration {
    return {
      autoApprove: provided?.autoApprove ?? false,
      maxFileOperations: provided?.maxFileOperations ?? 100,
      allowedDirectories: provided?.allowedDirectories ?? ['src/', 'tests/'],
      taskTimeout: provided?.taskTimeout ?? 300000,
      concurrentTasks: provided?.concurrentTasks ?? 3,
      integrations: {
        workspace: true,
        terminal: true,
        browser: false,
        vscode: true,
        ...provided?.integrations,
      },
      capabilities: {
        fileOperations: true,
        codeAnalysis: true,
        terminalAccess: false,
        webBrowsing: false,
        imageProcessing: false,
        ...provided?.capabilities,
      },
      automationLevel: provided?.automationLevel ?? 'semi-auto',
      notifications: {
        onTaskStart: true,
        onTaskComplete: true,
        onError: true,
        onApprovalRequired: true,
        ...provided?.notifications,
      },
    };
  }

  private getDefaultPermissions(provided?: Partial<ClaudeDevPermissions>): ClaudeDevPermissions {
    return {
      canCreateFiles: provided?.canCreateFiles ?? true,
      canDeleteFiles: provided?.canDeleteFiles ?? false,
      canModifyFiles: provided?.canModifyFiles ?? true,
      canExecuteTerminal: provided?.canExecuteTerminal ?? false,
      canBrowseWeb: provided?.canBrowseWeb ?? false,
      canAccessWorkspace: provided?.canAccessWorkspace ?? true,
      allowedFileTypes: provided?.allowedFileTypes ?? ['.ts', '.js', '.json', '.md'],
      restrictedPaths: provided?.restrictedPaths ?? ['node_modules/', '.git/'],
      maxFileSize: provided?.maxFileSize ?? 10485760,
    };
  }

  private async validateAgentConfiguration(agent: ClaudeDevAgent): Promise<void> {
    if (agent.configuration.maxFileOperations < 1) {
      throw new Error('maxFileOperations must be at least 1');
    }
    if (agent.configuration.taskTimeout < 1000) {
      throw new Error('taskTimeout must be at least 1000ms');
    }
    if (agent.permissions.maxFileSize < 1024) {
      throw new Error('maxFileSize must be at least 1KB');
    }
  }

  private async initializeAgent(agent: ClaudeDevAgent): Promise<void> {
    try {
      agent.status = 'active';
      agent.health.status = 'healthy';
      agent.health.lastHealthCheck = new Date();
      this.logger.log(`Initialized agent: ${agent.id}`);
    } catch (error) {
      agent.status = 'error';
      agent.health.status = 'unhealthy';
      throw error;
    }
  }

  private async startHealthChecks(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000);
  }

  private async startMetricsCollection(): Promise<void> {
    this.metricsCollectionInterval = setInterval(async () => {
      await this.collectMetrics();
    }, 300000);
  }

  private async performHealthChecks(): Promise<void> {
    for (const agent of this.agents.values()) {
      try {
        agent.health.lastHealthCheck = new Date();
        agent.health.status = agent.status === 'active' ? 'healthy' : 'unhealthy';
        agent.health.uptime = Date.now() - agent.createdAt.getTime();
      } catch (error) {
        agent.health.status = 'unhealthy';
        agent.health.errorCount++;
        this.logger.warn(`Health check failed for agent ${agent.id}`, error);
      }
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const stats = await this.getStatistics();
      this.logger.debug('Collected metrics', stats);
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Event Handlers
  private handleAgentCreated(data: any): void {
    this.logger.log(`Agent created: ${data.agent.id}`);
  }

  private handleTaskStarted(data: any): void {
    this.logger.log(`Task started: ${data.task.id}`);
  }

  private handleTaskCompleted(data: any): void {
    this.logger.log(`Task completed: ${data.task.id}`);
  }

  private handleTaskFailed(data: any): void {
    this.logger.error(`Task failed: ${data.task.id}`, data.error);
  }
}
