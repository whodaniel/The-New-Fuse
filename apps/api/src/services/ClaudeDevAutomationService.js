var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
let ClaudeDevAutomationService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = EventEmitter;
    var ClaudeDevAutomationService = _classThis = class extends _classSuper {
        constructor(configService) {
            super();
            this.configService = configService;
            this.logger = new Logger(ClaudeDevAutomationService.name);
            this.agents = new Map();
            this.tasks = new Map();
            this.initialized = false;
            this.setupEventListeners();
        }
        async onModuleInit() {
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
            }
            catch (error) {
                this.logger.error('Failed to initialize Claude Dev Automation Service', error);
                this.emit('service:error', { error, timestamp: new Date() });
                throw error;
            }
        }
        async onModuleDestroy() {
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
        async createAgent(tenantId, agentData) {
            try {
                const agentId = this.generateId('agent');
                const now = new Date();
                const agent = {
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
            }
            catch (error) {
                this.logger.error('Failed to create Claude Dev agent', error);
                throw error;
            }
        }
        async getAgent(agentId, tenantId) {
            const agent = this.agents.get(agentId);
            return agent && agent.tenantId === tenantId ? agent : undefined;
        }
        async getAgentsByTenant(tenantId) {
            return Array.from(this.agents.values()).filter(agent => agent.tenantId === tenantId);
        }
        // Task Management
        async executeTask(agentId, tenantId, taskData) {
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
                const task = {
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
            }
            catch (error) {
                this.logger.error('Failed to create task', error);
                throw error;
            }
        }
        async getStatistics(tenantId) {
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
        async getHealthStatus() {
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
        setupEventListeners() {
            this.on('agent:created', this.handleAgentCreated.bind(this));
            this.on('task:started', this.handleTaskStarted.bind(this));
            this.on('task:completed', this.handleTaskCompleted.bind(this));
            this.on('task:failed', this.handleTaskFailed.bind(this));
        }
        async executeTaskAsync(task, agent) {
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
            }
            catch (error) {
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
        async performTaskExecution(task, agent) {
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
        getDefaultConfiguration(provided) {
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
        getDefaultPermissions(provided) {
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
        async validateAgentConfiguration(agent) {
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
        async initializeAgent(agent) {
            try {
                agent.status = 'active';
                agent.health.status = 'healthy';
                agent.health.lastHealthCheck = new Date();
                this.logger.log(`Initialized agent: ${agent.id}`);
            }
            catch (error) {
                agent.status = 'error';
                agent.health.status = 'unhealthy';
                throw error;
            }
        }
        async startHealthChecks() {
            this.healthCheckInterval = setInterval(async () => {
                await this.performHealthChecks();
            }, 60000);
        }
        async startMetricsCollection() {
            this.metricsCollectionInterval = setInterval(async () => {
                await this.collectMetrics();
            }, 300000);
        }
        async performHealthChecks() {
            for (const agent of this.agents.values()) {
                try {
                    agent.health.lastHealthCheck = new Date();
                    agent.health.status = agent.status === 'active' ? 'healthy' : 'unhealthy';
                    agent.health.uptime = Date.now() - agent.createdAt.getTime();
                }
                catch (error) {
                    agent.health.status = 'unhealthy';
                    agent.health.errorCount++;
                    this.logger.warn(`Health check failed for agent ${agent.id}`, error);
                }
            }
        }
        async collectMetrics() {
            try {
                const stats = await this.getStatistics();
                this.logger.debug('Collected metrics', stats);
            }
            catch (error) {
                this.logger.error('Failed to collect metrics', error);
            }
        }
        generateId(prefix) {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 8);
            return `${prefix}_${timestamp}_${random}`;
        }
        // Event Handlers
        handleAgentCreated(data) {
            this.logger.log(`Agent created: ${data.agent.id}`);
        }
        handleTaskStarted(data) {
            this.logger.log(`Task started: ${data.task.id}`);
        }
        handleTaskCompleted(data) {
            this.logger.log(`Task completed: ${data.task.id}`);
        }
        handleTaskFailed(data) {
            this.logger.error(`Task failed: ${data.task.id}`, data.error);
        }
    };
    __setFunctionName(_classThis, "ClaudeDevAutomationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ClaudeDevAutomationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ClaudeDevAutomationService = _classThis;
})();
export { ClaudeDevAutomationService };
