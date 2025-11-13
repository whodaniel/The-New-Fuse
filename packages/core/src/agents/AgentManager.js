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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const common_1 = require("@nestjs/common");
const AgentSystem_1 = require("./AgentSystem");
const AgentCommunicationManager_1 = require("./AgentCommunicationManager");
const LoggingService_1 = require("../services/LoggingService");
let AgentManager = class AgentManager {
    agentSystem;
    communicationManager;
    logger;
    config;
    healthCheckTimer;
    constructor(agentSystem, communicationManager, logger) {
        this.agentSystem = agentSystem;
        this.communicationManager = communicationManager;
        this.logger = logger;
        this.config = {
            maxAgents: 100,
            taskTimeout: 300000, // 5 minutes
            healthCheckInterval: 60000 // 1 minute
        };
        this.startHealthChecks();
    }
    /**
     * Initialize the agent manager
     */
    async initialize(config) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
        this.logger.log('AgentManager initialized', 'AgentManager');
    }
    /**
     * Create and register a new agent
     */
    async createAgent(name, type, capabilities, metadata) {
        // Check agent limit
        const currentAgents = this.agentSystem.getAgents();
        if (currentAgents.length >= this.config.maxAgents) {
            throw new Error(`Agent limit reached: ${this.config.maxAgents});
    }
`);
            const agentId = `agent_${Date.now()}`, _$, { Math, random };
            ().toString(36).substr(2, 9);
        }
        ;
        const agent = {
            id: agentId,
            name,
            type,
            status: 'idle',
            capabilities,
            metadata
        };
        await this.agentSystem.registerAgent(agent);
        `
    this.logger.log(`;
        AgentSystem_1.Agent;
        created: $;
        {
            name;
        }
        ` (${agentId}), 'AgentManager');
    
    return agentId;
  }

  /**
   * Remove agent from system
   */
  async removeAgent(agentId: string): Promise<void> {
    const agent = this.agentSystem.getAgent(agentId);
    if (!agent) {`;
        throw new Error(AgentSystem_1.Agent, not, found, $, { agentId } `);
    }

    // Cancel any pending tasks
    const pendingTasks = this.agentSystem.getAgentTasks(agentId)
      .filter(task => task.status === 'pending' || task.status === 'processing');
    
    for (const task of pendingTasks) {
      await this.agentSystem.updateTaskStatus(task.id, 'failed');
    }

    await this.agentSystem.unregisterAgent(agentId);
    
    this.logger.log(Agent removed: ${agent.name}`($, { agentId }), 'AgentManager');
    }
    /**
     * Assign task to specific agent
     */
    async assignTaskToAgent(agentId, taskType, payload, metadata) {
        const agent = this.agentSystem.getAgent(agentId);
        `
    if (!agent) {`;
        throw new Error(AgentSystem_1.Agent, not, found, $, { agentId } `);
    }

    if (agent.status === 'error') {
      throw new Error(Agent is in error state: ${agentId});
    }

    const taskId = await this.agentSystem.assignTask(agentId, {
      type: taskType,
      payload,
      metadata
    });

    // Update agent status
    await this.agentSystem.updateAgentStatus(agentId, 'busy');
    `, this.logger.log(`Task assigned: ${taskId} -> ${agent.name}, 'AgentManager');
    
    return taskId;
  }

  /**
   * Find best agent for a task based on capabilities
   */
  async findBestAgentForTask(requiredCapabilities: string[]): Promise<string | null> {
    const agents = this.agentSystem.getAgents();
    
    // Filter agents that have required capabilities and are available
    const availableAgents = agents.filter(agent => 
      agent.status === 'idle' && 
      requiredCapabilities.every(cap => agent.capabilities.includes(cap))
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Return the first available agent (could be enhanced with load balancing)
    return availableAgents[0].id;
  }

  /**
   * Auto-assign task to best available agent
   */
  async autoAssignTask(
    taskType: string,
    payload: any,
    requiredCapabilities: string[] = [],
    metadata?: Record<string, any>
  ): Promise<string> {
    const agentId = await this.findBestAgentForTask(requiredCapabilities);
    
    if (!agentId) {
      throw new Error('No suitable agent available for task');
    }

    return this.assignTaskToAgent(agentId, taskType, payload, metadata);
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result?: any): Promise<void> {`));
        const task = this.agentSystem.getTask(taskId);
        `
    if (!task) {
      throw new Error(Task not found: ${taskId});
    }

    await this.agentSystem.updateTaskStatus(taskId, 'completed');
    `;
        // Update agent status back to idle`
        await this.agentSystem.updateAgentStatus(task.agentId, 'idle');
        `
    
    this.logger.log(Task completed: ${taskId}, 'AgentManager');
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId: string, error?: string): Promise<void> {
    const task = this.agentSystem.getTask(taskId);`;
        if (!task) {
            `
      throw new Error(Task not found: ${taskId}`;
            ;
        }
        await this.agentSystem.updateTaskStatus(taskId, 'failed');
        // Update agent status back to idle
        await this.agentSystem.updateAgentStatus(task.agentId, 'idle');
        this.logger.error(Task, failed, $, { taskId }, $, { error } - $, { error }, '');
    }
};
exports.AgentManager = AgentManager;
exports.AgentManager = AgentManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentSystem_1.AgentSystem,
        AgentCommunicationManager_1.AgentCommunicationManager,
        LoggingService_1.LoggingService])
], AgentManager);
undefined, 'AgentManager';
;
/**
 * Get system overview
 */
getSystemOverview();
{
    agents: AgentSystem_1.Agent[];
    systemStats: any;
    communicationStats: any;
}
{
    return {
        agents: this.agentSystem.getAgents(),
        systemStats: this.agentSystem.getSystemStats(),
        communicationStats: this.communicationManager.getCommunicationStats()
    };
}
startHealthChecks();
void {
    this: .healthCheckTimer = setInterval(() => {
        this.performHealthCheck();
    }, this.config.healthCheckInterval)
};
performHealthCheck();
void {
    const: agents = this.agentSystem.getAgents(),
    const: now = new Date(),
    // Check for stuck tasks
    for(, agent, of, agents) {
        const tasks = this.agentSystem.getAgentTasks(agent.id);
        const stuckTasks = tasks.filter(task => task.status === 'processing' &&
            (now.getTime() - task.updatedAt.getTime()) > this.config.taskTimeout);
        if (stuckTasks.length > 0) {
            `
        this.logger.warn(`;
            AgentSystem_1.Agent;
            $;
            {
                agent.name;
            }
            ` has ${stuckTasks.length} stuck tasks`,
                'AgentManager';
            ;
            // Mark stuck tasks as failed
            stuckTasks.forEach(task => {
                this.agentSystem.updateTaskStatus(task.id, 'failed');
            });
            // Reset agent status
            this.agentSystem.updateAgentStatus(agent.id, 'idle');
        }
    }
};
/**
 * Cleanup resources
 */
async;
destroy();
Promise < void  > {
    : .healthCheckTimer
};
{
    clearInterval(this.healthCheckTimer);
}
this.logger.log('AgentManager destroyed', 'AgentManager');
//# sourceMappingURL=AgentManager.js.map