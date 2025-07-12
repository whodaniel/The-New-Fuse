var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentOrchestrator_1;
import { EventEmitter } from 'events';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
let AgentOrchestrator = AgentOrchestrator_1 = class AgentOrchestrator extends EventEmitter {
    logger = new Logger(AgentOrchestrator_1.name);
    tasks = new Map();
    agents = new Map();
    taskQueue = [];
    constructor() {
        super();
        this.logger.log('AgentOrchestrator initialized');
    }
    addTask(task) {
        const taskId = uuidv4();
        const newTask = {
            ...task,
            id: taskId,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            retries: 0
        };
        this.tasks.set(taskId, newTask);
        this.taskQueue.push(taskId);
        this.emit('taskAdded', newTask);
        this.logger.log(`Task added: ${taskId}`);
        // Try to assign immediately
        this.tryAssignTask();
        return taskId;
    }
    async executeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        if (task.status !== 'pending') {
            throw new Error(`Task ${taskId} is not in pending state`);
        }
        try {
            // Wait for an available agent if none are free
            const agent = await this.getAvailableAgent();
            if (!agent) {
                await new Promise((resolve) => this.once('agentAvailable', resolve));
            }
            this.logger.log(`Executing task ${taskId}`);
            task.status = 'in_progress';
            task.updatedAt = new Date();
            this.emit('taskStarted', task);
            // Simulate task execution - replace with actual agent communication
            const result = await this.performTask(task);
            task.status = result.success ? 'completed' : 'failed';
            task.updatedAt = new Date();
            this.emit('taskCompleted', task);
            return result;
        }
        catch (error) {
            task.status = 'failed';
            task.updatedAt = new Date();
            this.emit('taskFailed', { task, error });
            throw error;
        }
    }
    getTaskStatus(taskId) {
        const task = this.tasks.get(taskId);
        return task?.status;
    }
    getPendingTasks() {
        return Array.from(this.tasks.values()).filter(task => task.status === 'pending');
    }
    getRunningTasks() {
        return Array.from(this.tasks.values()).filter(task => task.status === 'in_progress');
    }
    cancelTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'pending') {
            return false;
        }
        task.status = 'failed';
        task.updatedAt = new Date();
        this.emit('taskCancelled', task);
        // Remove from queue
        const index = this.taskQueue.indexOf(taskId);
        if (index > -1) {
            this.taskQueue.splice(index, 1);
        }
        return true;
    }
    retryTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'failed' || task.retries >= task.maxRetries) {
            return false;
        }
        task.status = 'pending';
        task.retries += 1;
        task.updatedAt = new Date();
        this.taskQueue.push(taskId);
        this.emit('taskRetried', task);
        this.tryAssignTask();
        return true;
    }
    registerAgent(agent) {
        const newAgent = {
            ...agent,
            lastActivity: new Date()
        };
        this.agents.set(agent.id, newAgent);
        this.emit('agentRegistered', newAgent);
        this.logger.log(`Agent registered: ${agent.id}`);
        if (newAgent.status === 'idle') {
            this.emit('agentAvailable', newAgent);
        }
    }
    async getAvailableAgent() {
        for (const agent of this.agents.values()) {
            if (agent.status === 'idle') {
                return agent;
            }
        }
        return null;
    }
    async tryAssignTask() {
        if (this.taskQueue.length === 0) {
            return;
        }
        const agent = await this.getAvailableAgent();
        if (agent) {
            const taskId = this.taskQueue.shift();
            if (taskId) {
                await this.executeTask(taskId);
            }
        }
    }
    async performTask(task) {
        // Placeholder for actual task execution logic
        // This would interface with specific agents based on task type
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
            return { success: true, data: `Task ${task.id} completed` };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    getAgentById(agentId) {
        return this.agents.get(agentId);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    getActiveAgents() {
        return Array.from(this.agents.values()).filter(agent => agent.status !== 'offline');
    }
};
AgentOrchestrator = AgentOrchestrator_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AgentOrchestrator);
export { AgentOrchestrator };
