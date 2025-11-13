"use strict";
/**
 * Agent Federation Terminal Bridge Service
 * Creates seamless integration between AgentFederation and Terminal Orchestration systems
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentFederationTerminalBridge_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFederationTerminalBridge = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const terminal_discovery_service_1 = require("./terminal-discovery.service");
const terminal_monitor_service_1 = require("./terminal-monitor.service");
let AgentFederationTerminalBridge = AgentFederationTerminalBridge_1 = class AgentFederationTerminalBridge {
    terminalDiscovery;
    terminalMonitor;
    eventEmitter;
    logger = new common_1.Logger(AgentFederationTerminalBridge_1.name);
    agentBindings = new Map();
    taskQueue = [];
    federationConfig;
    heartbeatTimer;
    rebalanceTimer;
    constructor(terminalDiscovery, terminalMonitor, eventEmitter) {
        this.terminalDiscovery = terminalDiscovery;
        this.terminalMonitor = terminalMonitor;
        this.eventEmitter = eventEmitter;
        this.federationConfig = {
            maxConcurrentTasks: 10,
            taskTimeout: 300000, // 5 minutes
            heartbeatInterval: 30000, // 30 seconds
            autoRebalance: true,
            fallbackStrategy: 'redistribute'
        };
        this.initializeFederationBridge();
    }
    /**
     * Initialize the federation bridge with auto-discovery and monitoring
     */
    async initializeFederationBridge() {
        this.logger.log('Initializing Agent Federation Terminal Bridge');
        // Discover and bind existing AI CLI terminals
        await this.discoverAndBindAgents();
        // Start monitoring services
        this.startHeartbeatMonitoring();
        this.startTaskRebalancing();
        this.setupEventListeners();
        this.logger.log(`Initialized with ${this.agentBindings.size} agent bindings);
  }

  /**
   * Discover AI CLI terminals and create agent bindings
   */
  async discoverAndBindAgents(): Promise<AgentTerminalBinding[]> {
    try {
      const terminals = await this.terminalDiscovery.searchTerminals({
        aiCliTypes: ['gemini', 'claude', 'openai'],
        isInteractive: true
      });

      const bindings: AgentTerminalBinding[] = [];

      for (const terminal of terminals) {
        if (terminal.aiCliType && terminal.isInteractive) {
          const binding = await this.createAgentBinding(terminal);
          bindings.push(binding);
        }
      }
`, this.logger.log(`Discovered ${bindings.length}`, agent - terminal, bindings));
        return bindings;
    }
    catch(error) {
        this.logger.error('Failed to discover and bind agents', error);
        throw error;
    }
};
exports.AgentFederationTerminalBridge = AgentFederationTerminalBridge;
exports.AgentFederationTerminalBridge = AgentFederationTerminalBridge = AgentFederationTerminalBridge_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [terminal_discovery_service_1.TerminalDiscoveryService,
        terminal_monitor_service_1.TerminalMonitorService,
        event_emitter_1.EventEmitter2])
], AgentFederationTerminalBridge);
async;
createAgentBinding(terminal, any);
Promise < AgentTerminalBinding > {
    const: agentId = agent_$
};
{
    terminal.aiCliType;
}
_$;
{
    terminal.pid;
}
;
const binding = {
    agentId,
    agentType: terminal.aiCliType,
    terminalPid: terminal.pid,
    terminalType: terminal.terminalType,
    capabilities: await this.determineAgentCapabilities(terminal.aiCliType),
    status: 'idle',
    lastActivity: new Date(),
    taskQueue: []
};
this.agentBindings.set(agentId, binding);
// Start monitoring this terminal
this.terminalMonitor.startMonitoring(terminal.pid, (content) => {
    this.handleTerminalActivity(agentId, content);
});
`
    this.logger.debug(Created agent binding: ${agentId}`;
;
return binding;
async;
determineAgentCapabilities(aiType, string);
Promise < string[] > {
    const: capabilityMap
};
{
    [key, string];
    string[];
}
{
    'gemini';
    [
        'code_generation', 'code_analysis', 'code_review', 'documentation',
        'multimodal_analysis', 'reasoning', 'planning', 'research'
    ],
        'claude';
    [
        'code_generation', 'code_analysis', 'code_review', 'refactoring',
        'architecture_design', 'documentation', 'debugging', 'testing'
    ],
        'openai';
    [
        'code_generation', 'code_analysis', 'natural_language_processing',
        'documentation', 'translation', 'summarization'
    ],
        'copilot';
    [
        'code_completion', 'code_generation', 'inline_suggestions',
        'vscode_integration'
    ],
        'cursor';
    [
        'code_editing', 'code_generation', 'codebase_navigation',
        'ai_chat', 'vscode_integration'
    ],
        'continue';
    [
        'code_generation', 'code_explanation', 'inline_editing',
        'vscode_integration', 'codebase_context'
    ];
}
;
return capabilityMap[aiType] || ['general_ai_assistance'];
/**
 * Delegate task to best available agent
 */
async;
delegateTask(task, (Omit));
Promise < string > {
    const: taskId = task_$
};
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
`;
    const fullTask: AgentTask = {
      id: taskId,
      ...task,
      status: 'pending',
      createdAt: new Date()
    };

    // Find best agent for this task
    const bestAgent = await this.findBestAgentForTask(fullTask);

    if (bestAgent) {
      await this.assignTaskToAgent(fullTask, bestAgent);
      this.logger.log(Task ${taskId} assigned to agent ${bestAgent.agentId});
    } else {
      // Add to global queue for later assignment
      this.taskQueue.push(fullTask);`;
this.logger.warn(Task, $, { taskId } ` queued - no available agents);
    }

    return taskId;
  }

  /**
   * Find the best agent for a specific task
   */
  private async findBestAgentForTask(task: AgentTask): Promise<AgentTerminalBinding | null> {
    const availableAgents = Array.from(this.agentBindings.values())
      .filter(agent => agent.status === 'idle' || agent.taskQueue.length < 3);

    if (availableAgents.length === 0) {
      return null;
    }

    // Score agents based on capability match and availability
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Capability matching
      const requiredCapabilities = this.extractRequiredCapabilities(task);
      const capabilityMatch = requiredCapabilities.filter(cap =>
        agent.capabilities.includes(cap)
      ).length / requiredCapabilities.length;
      score += capabilityMatch * 50;

      // Availability scoring
      if (agent.status === 'idle') score += 30;
      score -= agent.taskQueue.length * 5;

      // Recent activity bonus
      const timeSinceActivity = Date.now() - agent.lastActivity.getTime();
      if (timeSinceActivity < 60000) score += 10; // Active in last minute

      return { agent, score };
    });

    // Sort by score and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0]?.agent || null;
  }

  /**
   * Extract required capabilities from task
   */
  private extractRequiredCapabilities(task: AgentTask): string[] {
    const typeCapabilityMap: Record<string, string[]> = {
      'code_generation': ['code_generation'],
      'code_review': ['code_review', 'code_analysis'],
      'code_refactoring': ['refactoring', 'code_analysis'],
      'documentation': ['documentation'],
      'debugging': ['debugging', 'code_analysis'],
      'testing': ['testing', 'code_generation'],
      'architecture_design': ['architecture_design', 'planning'],
      'research': ['research', 'reasoning'],
      'multimodal_analysis': ['multimodal_analysis'],
      'vscode_interaction': ['vscode_integration']
    };

    console.log('DEBUG: extractRequiredCapabilities - task.type:', task.type, 'typeof:', typeof task.type);
    console.log('DEBUG: typeCapabilityMap keys:', Object.keys(typeCapabilityMap));
    console.log('DEBUG: typeCapabilityMap[task.type]:', typeCapabilityMap[task.type]);

    return typeCapabilityMap[task.type] || ['general_ai_assistance'];
  }

  /**
   * Assign task to specific agent
   */
  private async assignTaskToAgent(task: AgentTask, agent: AgentTerminalBinding): Promise<void> {
    task.assignedAgent = agent.agentId;
    task.status = 'in_progress';

    agent.taskQueue.push(task);
    agent.status = 'busy';
    agent.lastActivity = new Date();

    // Execute task in terminal
    await this.executeTaskInTerminal(agent, task);

    // Emit task assignment event
    this.eventEmitter.emit('agent.task.assigned', {
      taskId: task.id,
      agentId: agent.agentId,
      terminalPid: agent.terminalPid
    });
  }

  /**
   * Execute task in agent's terminal
   */
  private async executeTaskInTerminal(agent: AgentTerminalBinding, task: AgentTask): Promise<void> {
    try {
      // Focus the terminal first
      const focusResult = await this.terminalDiscovery.focusTerminal(agent.terminalPid);
      if (!focusResult.success) {
        throw new Error(Failed to focus terminal ${agent.terminalPid});
      }

      // Format task for agent
      const taskMessage = this.formatTaskForAgent(task, agent.agentType);

      // Send task to terminal
      const success = await this.terminalDiscovery.sendInputToTerminal(
        agent.terminalPid,
        taskMessage
      );
`);
if (!success) {
    `
        throw new Error(Failed to send task to terminal ${agent.terminalPid});
      }
`;
    this.logger.debug(Task, $, { task, : .id } ` sent to agent ${agent.agentId});

      // Set timeout for task completion
      setTimeout(() => {
        this.checkTaskTimeout(task.id);
      }, this.federationConfig.taskTimeout);` `
    } catch (error) {
      this.logger.error(Failed to execute task ${task.id} in terminal`, error);
    await this.handleTaskFailure(task, agent, error);
}
formatTaskForAgent(task, AgentTask, agentType, string);
string;
{
    const taskContext = {
        taskId: task.id,
        type: task.type,
        priority: task.priority,
        deadline: task.deadline?.toISOString(),
        payload: task.payload
    };
    const basePrompt = FEDERATION, TASK, DELEGATION, ID, { task, id };
    `
Type: ${task.type}`;
    Priority: $;
    {
        task.priority;
    }
    `
${task.deadline ? Deadline : $;
    {
        task.deadline.toISOString();
    }
    '';
}
`
`;
Context: $;
{
    JSON.stringify(task.payload, null, 2);
}
Please;
execute;
this;
task;
and;
respond;
with ()
    : 1.;
Your;
analysis;
and;
approach;
2.;
Step - by - step;
implementation;
3.;
Final;
result;
or;
deliverable;
4.;
Any;
recommendations;
or;
next;
steps `
When complete, please indicate "TASK ${task.id} COMPLETED" in your response.`;
// Agent-specific formatting
switch (agentType) {
    case 'gemini':
        return $;
        {
            basePrompt;
        }
        n;
        nAs;
        Gemini, leverage;
        your;
        multimodal;
        capabilities;
        and;
        reasoning;
        strengths;
        for (this; task.; `
      case 'claude':`)
            return $;
        {
            basePrompt;
        }
        n;
        nAs;
        Claude, apply;
        your;
        code;
        analysis;
        and;
        architectural;
        design;
        expertise;
        to;
        this;
        task. `;

      case 'openai':
        return ${basePrompt}\n\nAs GPT, use your natural language processing and general knowledge for this task.;

      default:
        return basePrompt;
    }
  }

  /**
   * Handle terminal activity from monitored agents
   */
  private handleTerminalActivity(agentId: string, content: any): void {
    const agent = this.agentBindings.get(agentId);
    if (!agent) return;

    agent.lastActivity = new Date();

    // Check for task completion indicators
    const activeTask = agent.taskQueue.find(task => task.status === 'in_progress');`;
        if (activeTask && content.content) {
            `
      if (content.content.includes(TASK ${activeTask.id}`;
            COMPLETED;
            {
                this.handleTaskCompletion(activeTask, agent, content);
            }
            if (content.status === 'error') {
                this.handleTaskError(activeTask, agent, content);
            }
        }
        // Update agent status based on activity
        if (agent.taskQueue.filter(t => t.status === 'in_progress').length === 0) {
            agent.status = 'idle';
        }
        // Emit activity event
        this.eventEmitter.emit('agent.activity', {
            agentId,
            terminalPid: agent.terminalPid,
            content,
            timestamp: new Date()
        });
}
async;
handleTaskCompletion(task, AgentTask, agent, AgentTerminalBinding, result, any);
Promise < void  > {
    task, : .status = 'completed',
    // Remove completed task from queue
    const: taskIndex = agent.taskQueue.findIndex(t => t.id === task.id),
    if(taskIndex) { }
} > -1;
{
    agent.taskQueue.splice(taskIndex, 1);
}
this.logger.log(Task, $, { task, : .id }, completed, by, agent, $, { agent, : .agentId });
// Emit completion event
this.eventEmitter.emit('agent.task.completed', {
    taskId: task.id,
    agentId: agent.agentId,
    result,
    duration: Date.now() - task.createdAt.getTime()
});
// Try to assign next task from queue
await this.processTaskQueue();
/**
 * Handle task error
 */ `
  private async handleTaskError(task: AgentTask, agent: AgentTerminalBinding, error: any): Promise<void> {`;
this.logger.error(Task, $, { task, : .id }, failed, on, agent, $, { agent, : .agentId }, error);
await this.handleTaskFailure(task, agent, error);
async;
handleTaskFailure(task, AgentTask, agent, AgentTerminalBinding, error, any);
Promise < void  > {
    task, : .status = 'failed',
    // Remove from agent's queue
    const: taskIndex = agent.taskQueue.findIndex(t => t.id === task.id),
    if(taskIndex) { }
} > -1;
{
    agent.taskQueue.splice(taskIndex, 1);
}
// Apply fallback strategy
switch (this.federationConfig.fallbackStrategy) {
    case 'redistribute':
        // Try to reassign to another agent
        const newAgent = await this.findBestAgentForTask(task);
        if (newAgent && newAgent.agentId !== agent.agentId) {
            `
          task.status = 'pending';`;
            await this.assignTaskToAgent(task, newAgent);
            `
          this.logger.log(Task ${task.id} redistributed to agent ${newAgent.agentId});
          return;
        }
        break;

      case 'queue':
        // Add back to global queue
        task.status = 'pending';
        this.taskQueue.push(task);`;
            this.logger.log(Task, $, { task, : .id }, returned, to, global, queue `);
        return;

      case 'fail_fast':
        // Fail immediately
        break;
    }

    // Emit failure event
    this.eventEmitter.emit('agent.task.failed', {
      taskId: task.id,
      agentId: agent.agentId,
      error: error.message,
      timestamp: new Date()
    });
  }

  /**
   * Check for task timeout
   */
  private checkTaskTimeout(taskId: string): void {
    for (const agent of this.agentBindings.values()) {
      const task = agent.taskQueue.find(t => t.id === taskId);
      if (task && task.status === 'in_progress') {
        const elapsed = Date.now() - task.createdAt.getTime();
        if (elapsed > this.federationConfig.taskTimeout) {
          this.logger.warn(Task ${taskId} timed out after ${elapsed}ms);
          this.handleTaskFailure(task, agent, new Error('Task timeout'));
        }
      }
    }
  }

  /**
   * Process global task queue
   */
  private async processTaskQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) break;

      const agent = await this.findBestAgentForTask(task);
      if (agent) {
        await this.assignTaskToAgent(task, agent);
      } else {
        // Put back in queue and wait
        this.taskQueue.unshift(task);
        break;
      }
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatTimer = setInterval(async () => {
      for (const [agentId, agent] of this.agentBindings) {
        const timeSinceActivity = Date.now() - agent.lastActivity.getTime();

        // Check if agent is responsive`);
            if (timeSinceActivity > this.federationConfig.heartbeatInterval * 2) {
                `
          this.logger.warn(Agent ${agentId} appears unresponsive (${timeSinceActivity}ms since last activity)`;
                ;
                agent.status = 'offline';
                // Redistribute tasks from offline agent
                await this.redistributeTasksFromAgent(agent);
            }
        }
}
this.federationConfig.heartbeatInterval;
;
startTaskRebalancing();
void {
    : .federationConfig.autoRebalance, return: ,
    this: .rebalanceTimer = setInterval(async () => {
        await this.rebalanceTaskLoad();
    }, 60000)
};
async;
rebalanceTaskLoad();
Promise < void  > {
    const: agents = Array.from(this.agentBindings.values())
        .filter(agent => agent.status !== 'offline'),
    if(agents) { }, : .length < 2, return: ,
    // Find overloaded and underloaded agents
    const: avgTasks = agents.reduce((sum, agent) => sum + agent.taskQueue.length, 0) / agents.length,
    const: overloadedAgents = agents.filter(agent => agent.taskQueue.length > avgTasks + 2),
    const: underloadedAgents = agents.filter(agent => agent.taskQueue.length < avgTasks - 1),
    // Redistribute tasks
    for(, overloaded, of, overloadedAgents) {
        for (const underloaded of underloadedAgents) {
            if (overloaded.taskQueue.length <= avgTasks)
                break;
            // Move a pending task
            const taskToMove = overloaded.taskQueue.find(task => task.status === 'pending');
            if (taskToMove && underloaded.taskQueue.length < avgTasks) {
                // Remove from overloaded agent
                const taskIndex = overloaded.taskQueue.findIndex(t => t.id === taskToMove.id);
                overloaded.taskQueue.splice(taskIndex, 1);
                // Assign to underloaded agent
                await this.assignTaskToAgent(taskToMove, underloaded);
                this.logger.debug(Rebalanced, task, $, { taskToMove, : .id }, from, $, { overloaded, : .agentId }, to, $, { underloaded, : .agentId });
            }
        }
    }
};
async;
redistributeTasksFromAgent(offlineAgent, AgentTerminalBinding);
Promise < void  > {
    const: pendingTasks = offlineAgent.taskQueue.filter(task => task.status === 'pending'),
    for(, task, of, pendingTasks) {
        const newAgent = await this.findBestAgentForTask(task);
        if (newAgent) {
            await this.assignTaskToAgent(task, newAgent);
        }
        else {
            this.taskQueue.push(task);
        }
    }
    // Clear offline agent's queue
    ,
    // Clear offline agent's queue
    offlineAgent, : .taskQueue = offlineAgent.taskQueue.filter(task => task.status === 'in_progress')
};
setupEventListeners();
void {
    // Listen for new terminal discoveries
    this: .eventEmitter.on('terminal.discovered', async (terminalData) => {
        if (terminalData.aiCliType && terminalData.isInteractive) {
            await this.createAgentBinding(terminalData);
        }
    }),
    // Listen for terminal disconnections`
    this: .eventEmitter.on('terminal.disconnected', (terminalData) => {
        `
      const agentId = agent_${terminalData.aiCliType}_${terminalData.pid}`;
        const agent = this.agentBindings.get(agentId);
        if (agent) {
            this.redistributeTasksFromAgent(agent);
            this.agentBindings.delete(agentId);
        }
    })
};
/**
 * Get federation status
 */
getFederationStatus();
any;
{
    const agents = Array.from(this.agentBindings.values());
    return {
        totalAgents: agents.length,
        agentsByStatus: {
            idle: agents.filter(a => a.status === 'idle').length,
            busy: agents.filter(a => a.status === 'busy').length,
            offline: agents.filter(a => a.status === 'offline').length,
            error: agents.filter(a => a.status === 'error').length
        },
        agentsByType: {
            gemini: agents.filter(a => a.agentType === 'gemini').length,
            claude: agents.filter(a => a.agentType === 'claude').length,
            openai: agents.filter(a => a.agentType === 'openai').length
        },
        taskQueue: {
            pending: this.taskQueue.length,
            inProgress: agents.reduce((sum, a) => sum + a.taskQueue.filter(t => t.status === 'in_progress').length, 0),
            totalTasks: agents.reduce((sum, a) => sum + a.taskQueue.length, 0)
        },
        config: this.federationConfig
    };
}
/**
 * Cleanup resources
 */
async;
cleanup();
Promise < void  > {
    : .heartbeatTimer
};
{
    clearInterval(this.heartbeatTimer);
}
if (this.rebalanceTimer) {
    clearInterval(this.rebalanceTimer);
}
// Stop all terminal monitoring
for (const agent of this.agentBindings.values()) {
    this.terminalMonitor.stopMonitoring(agent.terminalPid);
}
this.agentBindings.clear();
this.taskQueue = [];
this.logger.log('Agent Federation Terminal Bridge cleaned up');
//# sourceMappingURL=agent-federation-terminal-bridge.service.js.map