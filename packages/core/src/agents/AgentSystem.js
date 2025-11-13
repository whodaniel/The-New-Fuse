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
exports.AgentSystem = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
let AgentSystem = class AgentSystem {
    logger;
    agents = new Map();
    tasks = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Register a new agent in the system
     */
    async registerAgent(agent) {
        this.agents.set(agent.id, {
            ...agent,
            status: 'idle'
        });
        this.logger.log(`Agent registered: ${agent.name} (${agent.id}), 'AgentSystem');
  }

  /**
   * Unregister an agent from the system
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);`, this.logger.log(Agent, unregistered, $, { agent, : .name } ` (${agentId}`), 'AgentSystem');
    }
};
exports.AgentSystem = AgentSystem;
exports.AgentSystem = AgentSystem = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], AgentSystem);
/**
 * Get all registered agents
 */
getAgents();
Agent[];
{
    return Array.from(this.agents.values());
}
/**
 * Get agent by ID
 */
getAgent(agentId, string);
Agent | undefined;
{
    return this.agents.get(agentId);
}
/**
 * Update agent status
 */
async;
updateAgentStatus(agentId, string, status, Agent['status']);
Promise < void  > {
    const: agent = this.agents.get(agentId),
    if(agent) {
        agent.status = status;
        this.logger.debug(Agent, status, updated, $, { agent, : .name } -  > $, { status }, 'AgentSystem');
    }
};
/**
 * Assign task to agent
 */
async;
assignTask(agentId, string, task, (Omit));
Promise < string > {
    const: agent = this.agents.get(agentId),
    if(, agent) {
        `
      throw new Error(`;
        Agent;
        not;
        found: $;
        {
            agentId;
        }
        ;
        `
    }`;
        const taskId = task_$, { Date };
    }, : .now()
} `_${Math.random().toString(36).substr(2, 9)};
    const agentTask: AgentTask = {
      id: taskId,
      agentId,
      ...task,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };` `
    this.tasks.set(taskId, agentTask);
    this.logger.log(Task assigned: ${taskId} -> ${agent.name}`, 'AgentSystem';
;
return taskId;
/**
 * Update task status
 */
async;
updateTaskStatus(taskId, string, status, AgentTask['status']);
Promise < void  > {
    const: task = this.tasks.get(taskId),
    if(task) {
        task.status = status;
        task.updatedAt = new Date();
        this.logger.debug(Task, status, updated, $, { taskId } -  > $, { status } ``, 'AgentSystem');
    }
};
/**
 * Get task by ID
 */
getTask(taskId, string);
AgentTask | undefined;
{
    return this.tasks.get(taskId);
}
/**
 * Get tasks for agent
 */
getAgentTasks(agentId, string);
AgentTask[];
{
    return Array.from(this.tasks.values()).filter(task => task.agentId === agentId);
}
/**
 * Get system statistics
 */
getSystemStats();
{
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    pendingTasks: number;
    processingTasks: number;
    completedTasks: number;
    failedTasks: number;
}
{
    const agents = this.getAgents();
    const tasks = Array.from(this.tasks.values());
    return {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        processingTasks: tasks.filter(t => t.status === 'processing').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        failedTasks: tasks.filter(t => t.status === 'failed').length
    };
}
//# sourceMappingURL=AgentSystem.js.map