import * as vscode from 'vscode';

export interface SwarmAgent {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    status: 'idle' | 'busy' | 'offline';
    workload: number;
}

export interface SwarmTask {
    id: string;
    description: string;
    assignedAgent?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export class AgentSwarmOrchestrationService {
    private agents = new Map<string, SwarmAgent>();
    private tasks = new Map<string, SwarmTask>();
    private taskQueue: SwarmTask[] = [];

    constructor(private context: vscode.ExtensionContext) {}

    public registerAgent(agent: SwarmAgent): void {
        this.agents.set(agent.id, agent);
    }

    public unregisterAgent(agentId: string): void {
        this.agents.delete(agentId);
        // Reassign tasks from this agent
        this.reassignTasksFromAgent(agentId);
    }

    public createTask(description: string, priority: number = 1): SwarmTask {
        const task: SwarmTask = {
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

    public assignTask(taskId: string, agentId: string): boolean {
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

    public completeTask(taskId: string): boolean {
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

    public failTask(taskId: string, reason?: string): boolean {
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

    public getAvailableAgents(): SwarmAgent[] {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'idle');
    }

    public getPendingTasks(): SwarmTask[] {
        return this.taskQueue.slice();
    }

    public getTaskStatus(taskId: string): SwarmTask | undefined {
        return this.tasks.get(taskId);
    }

    public getAgentWorkload(agentId: string): number {
        const agent = this.agents.get(agentId);
        return agent ? agent.workload : 0;
    }

    private assignNextTask(): void {
        if (this.taskQueue.length === 0) {
            return;
        }

        const availableAgents = this.getAvailableAgents();
        if (availableAgents.length === 0) {
            return;
        }

        // Find best agent for next task (lowest workload)
        const bestAgent = availableAgents.reduce((best, current) => 
            current.workload < best.workload ? current : best
        );

        const nextTask = this.taskQueue[0];
        this.assignTask(nextTask.id, bestAgent.id);
    }

    private reassignTasksFromAgent(agentId: string): void {
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

    private sortTaskQueue(): void {
        this.taskQueue.sort((a, b) => b.priority - a.priority);
    }

    private generateId(): string {
        return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public dispose(): void {
        this.agents.clear();
        this.tasks.clear();
        this.taskQueue = [];
    }
}
