"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EnhancedGeminiCoordinatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedGeminiCoordinatorService = void 0;
const common_1 = require("@nestjs/common");
const vscode_terminal_service_1 = require("./vscode-terminal.service");
const secure_subprocess_service_1 = require("./secure-subprocess.service");
const git_transaction_service_1 = require("./git-transaction.service");
let EnhancedGeminiCoordinatorService = EnhancedGeminiCoordinatorService_1 = class EnhancedGeminiCoordinatorService {
    terminalService;
    subprocessService;
    gitService;
    logger = new common_1.Logger(EnhancedGeminiCoordinatorService_1.name);
    agents = new Map();
    tasks = new Map();
    workflows = new Map();
    taskQueue = [];
    monitoringInterval;
    constructor(terminalService, subprocessService, gitService) {
        this.terminalService = terminalService;
        this.subprocessService = subprocessService;
        this.gitService = gitService;
        this.logger.log('EnhancedGeminiCoordinatorService initialized');
        this.startAgentMonitoring();
    }
    /**
     * Initialize multiple Gemini agents
     */
    async initializeAgentPool(count = 3) {
        const agentIds = [];
        try {
            for (let i = 0; i < count; i++) {
                const agentId = await this.createAgent([
                    'analysis', 'code_generation', 'documentation', 'testing'
                ]);
                agentIds.push(agentId);
                // Stagger agent creation to avoid overwhelming the system
                if (i < count - 1) {
                    await this.delay(2000);
                }
            }
            this.logger.log(`Initialized agent pool with ${count} agents: ${agentIds.join(', ')});
      return agentIds;

    } catch (error) {`, this.logger.error(Failed, to, initialize, agent, pool, $, { error } `);
      throw error;
    }
  }

  /**
   * Create a single Gemini agent
   */
  async createAgent(capabilities: string[]): Promise<string> {
    try {
      // Create terminal session for the agent
      const terminalSessionId = await this.terminalService.createTerminalWithFocus();

      // Launch Gemini CLI in the terminal
      await this.terminalService.launchGeminiCLI(terminalSessionId);

      // Track terminal PID for coordination
      await this.terminalService.trackTerminalPID(terminalSessionId);

      const agentId = `, agent_$, { Date, : .now() }, _$, { Math, : .random().toString(36).substr(2, 6) }));
            const agent = {
                id: agentId,
                terminalSessionId,
                status: 'idle',
                capabilities: [...capabilities],
                lastActivity: new Date(),
                totalTasksCompleted: 0,
                averageTaskDuration: 0,
                quotaStatus: {
                    model: 'pro',
                    quotaExceeded: false,
                    lastQuotaCheck: new Date()
                },
                performance: {
                    successRate: 100,
                    averageResponseTime: 0,
                    errorCount: 0
                }
            };
            this.agents.set(agentId, agent);
            `
      this.logger.log(Created Gemini agent: ${agentId}`;
            with (capabilities)
                : $;
            {
                capabilities.join(', ');
            }
            ;
            return agentId;
            `
`;
        }
        catch (error) {
            this.logger.error(Failed, to, create, Gemini, agent, $, { error } `);
      throw error;
    }
  }

  /**
   * Execute workflow with multiple agents
   */
  async executeWorkflow(
    name: string,
    tasks: Omit<AgentTask, 'id' | 'status' | 'createdAt'>[],
    strategy: CoordinationStrategy = { type: 'priority_based', parameters: {} }
  ): Promise<string> {
    const workflowId = workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
            try {
                // Create tasks with IDs
                const workflowTasks = tasks.map((taskData, index) => ({
                    ...taskData,
                    id: task_$
                }), { workflowId }, _$, { index }, status, 'pending', createdAt, new Date());
            }
            finally // Create workflow execution
             { }
            ;
            // Create workflow execution
            const workflow = {
                id: workflowId,
                name,
                tasks: workflowTasks,
                strategy,
                status: 'planning',
                startTime: new Date(),
                progress: {
                    total: workflowTasks.length,
                    completed: 0,
                    failed: 0,
                    percentage: 0
                },
                agents: Array.from(this.agents.keys()),
                results: {}
            };
            this.workflows.set(workflowId, workflow);
            // Add tasks to queue and internal tracking
            for (const task of workflowTasks) {
                this.tasks.set(task.id, task);
                this.taskQueue.push(task);
            }
            // Start workflow execution
            workflow.status = 'executing';
            `
      this.processTaskQueue();` `
      this.logger.log(Started workflow execution: ${name} (${workflowId}) with ${workflowTasks.length} tasks);`;
            return workflowId;
            `
`;
        }
        try { }
        catch (error) {
            this.logger.error(Failed, to, execute, workflow, $, { error });
            throw error;
        }
    }
    /**
     * Assign task to best available agent
     */
    async assignTask(taskId, agentId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'pending') {
            return false;
        }
        try {
            let selectedAgent = null;
            if (agentId) {
                // Use specified agent if available
                selectedAgent = this.agents.get(agentId) || null;
            }
            else {
                // Auto-select best agent
                selectedAgent = this.selectBestAgent(task);
            }
            if (!selectedAgent || selectedAgent.status !== 'idle') {
                `
        this.logger.warn(No available agent for task: ${taskId}`;
                ;
                return false;
            }
            // Update task status
            task.status = 'assigned';
            task.assignedAgent = selectedAgent.id;
            task.assignedAt = new Date();
            // Update agent status
            selectedAgent.status = 'busy';
            selectedAgent.currentTask = taskId;
            this.logger.log(Assigned, task, $, { taskId }, to, agent, $, { selectedAgent, : .id });
            `
      return true;`;
        }
        catch (error) {
            `
      this.logger.error(Failed to assign task ${taskId}: ${error});
      return false;
    }
  }

  /**
   * Execute assigned task on agent
   */`;
            async;
            executeTask(taskId, string);
            Promise < any > {} `
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'assigned' || !task.assignedAgent) {`;
            throw new Error(Task, not, ready);
            for (execution; ; )
                : $;
            {
                taskId;
            }
            ;
        }
        const agent = this.agents.get(task.assignedAgent);
        `
    if (!agent) {`;
        throw new Error(Agent, not, found, $, { task, : .assignedAgent });
    }
};
exports.EnhancedGeminiCoordinatorService = EnhancedGeminiCoordinatorService;
exports.EnhancedGeminiCoordinatorService = EnhancedGeminiCoordinatorService = EnhancedGeminiCoordinatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vscode_terminal_service_1.VSCodeTerminalService,
        secure_subprocess_service_1.SecureSubprocessService,
        git_transaction_service_1.GitTransactionService])
], EnhancedGeminiCoordinatorService);
try {
    task.status = 'in_progress';
    task.startedAt = new Date();
    agent.lastActivity = new Date();
    `
      this.logger.log(Executing task ${taskId}`;
    on;
    agent;
    $;
    {
        agent.id;
    }
    $;
    {
        task.title;
    }
    ;
    // Focus agent's terminal and send task
    await this.terminalService.focusTerminalByPID(agent.terminalSessionId);
    await this.terminalService.sendTaskToGemini(agent.terminalSessionId, task.description);
    // Monitor response with timeout
    const response = await this.terminalService.monitorGeminiResponse(agent.terminalSessionId, task.estimatedDuration || 30000);
    // Handle potential errors and recovery
    if (this.isQuotaExceededResponse(response)) {
        agent.quotaStatus.quotaExceeded = true;
        agent.quotaStatus.model = 'flash';
        agent.status = 'quota_exceeded';
        // Attempt recovery
        await this.terminalService.handleGeminiErrorRecovery(agent.terminalSessionId, task.description);
        // Monitor recovery response
        const recoveryResponse = await this.terminalService.monitorGeminiResponse(agent.terminalSessionId, task.estimatedDuration || 30000);
        task.result = recoveryResponse;
    }
    else {
        task.result = response;
    }
    // Update task status
    task.status = 'completed';
    task.completedAt = new Date();
    // Update agent status and metrics
    agent.status = 'idle';
    agent.currentTask = undefined;
    agent.totalTasksCompleted++;
    agent.lastActivity = new Date();
    const duration = task.completedAt.getTime() - task.startedAt.getTime();
    agent.averageTaskDuration =
        (agent.averageTaskDuration * (agent.totalTasksCompleted - 1) + duration) /
            agent.totalTasksCompleted;
    agent.performance.successRate =
        (agent.totalTasksCompleted - agent.performance.errorCount) /
            agent.totalTasksCompleted * 100;
    `
`;
    this.logger.log(Task, completed, $, { taskId }, by, agent, $, { agent, : .id } in $, { duration }, ms);
    // Update workflow progress
    this.updateWorkflowProgress(taskId);
    return task.result;
}
catch (error) {
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : String(error);
    task.completedAt = new Date();
    agent.status = 'error';
    `
      agent.currentTask = undefined;`;
    agent.performance.errorCount++;
    `

      this.logger.error(Task failed: ${taskId} on agent ${agent.id}, error);
      throw error;
    }
  }

  /**
   * Monitor agents for dormancy and errors
   */
  async monitorAgents(): Promise<void> {
    const now = Date.now();
    const dormancyThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [agentId, agent] of Array.from(this.agents.entries())) {
      const inactiveDuration = now - agent.lastActivity.getTime();

      // Check for dormant agents
      if (inactiveDuration > dormancyThreshold && agent.status === 'busy') {`;
    this.logger.warn(Agent, $, { agentId } ` appears dormant, attempting recovery);
        agent.status = 'dormant';

        // Attempt to recover dormant agent
        await this.recoverDormantAgent(agentId);
      }

      // Check quota status periodically
      if (now - agent.quotaStatus.lastQuotaCheck.getTime() > 10 * 60 * 1000) {
        await this.checkAgentQuotaStatus(agentId);
      }

      // Reassign tasks from failed agents
      if (agent.status === 'error' && agent.currentTask) {
        await this.reassignTask(agent.currentTask);
      }
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): WorkflowExecution | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): GeminiAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.status === 'idle' || agent.status === 'busy'
    );
  }

  /**
   * Get agent performance metrics
   */
  getAgentMetrics(agentId: string): GeminiAgent['performance'] | null {
    const agent = this.agents.get(agentId);
    return agent ? agent.performance : null;
  }

  /**
   * Pause workflow execution
   */
  pauseWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status !== 'executing') {
      return false;
    }

    workflow.status = 'paused';
    this.logger.log(Paused workflow: ${workflowId});
    return true;
  }

  /**
   * Resume workflow execution
   */
  resumeWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status !== 'paused') {
      return false;
    }

    workflow.status = 'executing';`, this.processTaskQueue());
    `
    this.logger.log(Resumed workflow: ${workflowId});
    return true;
  }

  /**
   * Private helper methods
   */

  private selectBestAgent(task: AgentTask): GeminiAgent | null {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'idle');

    if (availableAgents.length === 0) {
      return null;
    }

    // Score agents based on capabilities, performance, and availability
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Capability match score (40% weight)
      const matchedCapabilities = agent.capabilities.filter(cap =>
        task.description.toLowerCase().includes(cap.toLowerCase())
      );
      score += (matchedCapabilities.length / agent.capabilities.length) * 40;

      // Performance score (30% weight)
      score += (agent.performance.successRate / 100) * 30;

      // Response time score (20% weight) - lower is better
      const responseTimeScore = Math.max(0, 20 - (agent.performance.averageResponseTime / 1000));
      score += responseTimeScore;

      // Load score (10% weight) - prefer agents with fewer completed tasks
      const loadScore = Math.max(0, 10 - (agent.totalTasksCompleted / 10));
      score += loadScore;

      return { agent, score };
    });

    // Sort by score and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0]?.agent || null;
  }

  private async processTaskQueue(): Promise<void> {
    const pendingTasks = this.taskQueue.filter(task => task.status === 'pending');

    for (const task of pendingTasks) {
      // Check dependencies
      const dependenciesMet = task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask?.status === 'completed';
      });

      if (!dependenciesMet) {
        continue;
      }

      // Try to assign and execute task
      const assigned = await this.assignTask(task.id);
      if (assigned) {`;
    // Execute in background`
    this.executeTask(task.id).catch(error => {
        `
          this.logger.error(Background task execution failed: ${task.id}, error);
        });
      }
    }
  }

  private isQuotaExceededResponse(response: string): boolean {
    const quotaIndicators = [
      'quota exceeded',
      'switching from gemini-2.5-pro to gemini-2.5-flash',
      'API quota exceeded',
      'rate limit exceeded'
    ];

    return quotaIndicators.some(indicator =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private async recoverDormantAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      // Attempt to reactivate the agent's terminal
      await this.terminalService.focusTerminalByPID(agent.terminalSessionId);

      // Send a simple test command
      await this.terminalService.sendTaskToGemini(
        agent.terminalSessionId,
        'Please confirm you are ready to process tasks.'
      );

      // Monitor response
      const response = await this.terminalService.monitorGeminiResponse(
        agent.terminalSessionId,
        5000
      );

      if (response) {
        agent.status = 'idle';
        agent.lastActivity = new Date();`;
        this.logger.log(Successfully, recovered, dormant, agent, $, { agentId } `);
      }

    } catch (error) {
      agent.status = 'error';
      this.logger.error(Failed to recover dormant agent: ${agentId}, error);
    }
  }

  private async checkAgentQuotaStatus(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.quotaStatus.lastQuotaCheck = new Date();

    // In a real implementation, this would check actual API quotas
    // For now, simulate quota recovery after some time
    if (agent.quotaStatus.quotaExceeded) {
      const timeSinceExceeded = Date.now() - agent.quotaStatus.lastQuotaCheck.getTime();
      if (timeSinceExceeded > 60 * 60 * 1000) { // 1 hour
        agent.quotaStatus.quotaExceeded = false;
        agent.quotaStatus.model = 'pro';
        agent.status = 'idle';
      }
    }
  }

  private async reassignTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Reset task status for reassignment
    task.status = 'pending';
    task.assignedAgent = undefined;
    task.assignedAt = undefined;

    // Add back to queue
    this.taskQueue.push(task);` `
    this.logger.log(Reassigned failed task: ${taskId});
  }

  private updateWorkflowProgress(completedTaskId: string): void {
    // Find workflow containing this task
    for (const [workflowId, workflow] of Array.from(this.workflows.entries())) {
      const task = workflow.tasks.find(t => t.id === completedTaskId);
      if (!task) continue;

      // Update progress
      workflow.progress.completed = workflow.tasks.filter(t => t.status === 'completed').length;
      workflow.progress.failed = workflow.tasks.filter(t => t.status === 'failed').length;
      workflow.progress.percentage = (workflow.progress.completed / workflow.progress.total) * 100;

      // Check if workflow is complete
      if (workflow.progress.completed + workflow.progress.failed === workflow.progress.total) {
        workflow.status = workflow.progress.failed > 0 ? 'failed' : 'completed';
        workflow.endTime = new Date();
`, this.logger.log(Workflow, $, { workflow, : .name } ` completed: ${workflow.progress.completed}/${workflow.progress.total} tasks successful`));
    });
    break;
}
startAgentMonitoring();
void {
    this: .monitoringInterval = setInterval(async () => {
        await this.monitorAgents();
    }, 30000)
};
delay(ms, number);
Promise < void  > {
    return: new Promise(resolve => setTimeout(resolve, ms))
};
/**
 * Cleanup method for service shutdown
 */
onModuleDestroy();
void {
    : .monitoringInterval
};
{
    clearInterval(this.monitoringInterval);
}
// Close all terminal sessions
for (const agent of this.agents.values()) {
    this.terminalService.closeSession(agent.terminalSessionId);
}
//# sourceMappingURL=enhanced-gemini-coordinator.service.js.map