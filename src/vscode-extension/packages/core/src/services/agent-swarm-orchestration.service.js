"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSwarmOrchestrationService = void 0;
class AgentSwarmOrchestrationService {
    constructor(context) {
        this.context = context;
        this.agents = new Map();
        this.tasks = new Map();
        this.taskQueue = [];
    }
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
    }
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        // Reassign tasks from this agent
        this.reassignTasksFromAgent(agentId);
    }
    createTask(description, priority = 1) {
        const task = {
            id: this.generateId(),
            description,
            status: 'pending',
            priority,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.tasks.set(task.id, task);
        this.taskQueue.push(task);
        this.sortTaskQueue();
        // Try to assign immediately
        this.assignNextTask();
        return task;
    }
    assignTask(taskId, agentId) {
        const task = this.tasks.get(taskId);
        const agent = this.agents.get(agentId);
        if (!task || !agent || agent.status !== 'idle') {
            return false;
        }
        task.assignedAgent = agentId;
        task.status = 'in-progress';
        task.updatedAt = new Date();
        agent.status = 'busy';
        agent.workload++;
        // Remove from queue if present
        this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
        return true;
    }
    completeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || !task.assignedAgent) {
            return false;
        }
        const agent = this.agents.get(task.assignedAgent);
        if (agent) {
            agent.status = 'idle';
            agent.workload = Math.max(0, agent.workload - 1);
        }
        task.status = 'completed';
        task.updatedAt = new Date();
        // Try to assign next task to the now-free agent
        this.assignNextTask();
        return true;
    }
    failTask(taskId, reason) {
        const task = this.tasks.get(taskId);
        if (!task || !task.assignedAgent) {
            return false;
        }
        const agent = this.agents.get(task.assignedAgent);
        if (agent) {
            agent.status = 'idle';
            agent.workload = Math.max(0, agent.workload - 1);
        }
        task.status = 'failed';
        task.updatedAt = new Date();
        // Could implement retry logic here
        return true;
    }
    getAvailableAgents() {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'idle');
    }
    getPendingTasks() {
        return this.taskQueue.slice();
    }
    getTaskStatus(taskId) {
        return this.tasks.get(taskId);
    }
    getAgentWorkload(agentId) {
        const agent = this.agents.get(agentId);
        return agent ? agent.workload : 0;
    }
    assignNextTask() {
        if (this.taskQueue.length === 0) {
            return;
        }
        const availableAgents = this.getAvailableAgents();
        if (availableAgents.length === 0) {
            return;
        }
        // Find best agent for next task (lowest workload)
        const bestAgent = availableAgents.reduce((best, current) => current.workload < best.workload ? current : best);
        const nextTask = this.taskQueue[0];
        this.assignTask(nextTask.id, bestAgent.id);
    }
    reassignTasksFromAgent(agentId) {
        const tasksToReassign = Array.from(this.tasks.values())
            .filter(task => task.assignedAgent === agentId && task.status === 'in-progress');
        tasksToReassign.forEach(task => {
            task.assignedAgent = undefined;
            task.status = 'pending';
            task.updatedAt = new Date();
            this.taskQueue.push(task);
        });
        this.sortTaskQueue();
        this.assignNextTask();
    }
    sortTaskQueue() {
        this.taskQueue.sort((a, b) => b.priority - a.priority);
    }
    generateId() {
        return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    dispose() {
        this.agents.clear();
        this.tasks.clear();
        this.taskQueue = [];
    }
}
exports.AgentSwarmOrchestrationService = AgentSwarmOrchestrationService;
//# sourceMappingURL=agent-swarm-orchestration.service.js.map