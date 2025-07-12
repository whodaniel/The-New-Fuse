var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let TaskService = TaskService_1 = class TaskService {
    eventEmitter;
    logger = new Logger(TaskService_1.name);
    tasks = new Map();
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async createTask(taskData) {
        // Mock implementation
        const task = {
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...taskData
        };
        this.tasks.set(task.id, task);
        this.eventEmitter.emit('task.created', task);
        return task;
    }
    async getTask(id) {
        // Mock implementation
        return this.tasks.get(id) || null;
    }
    async updateTask(id, updates) {
        // Mock implementation
        const task = this.tasks.get(id);
        if (!task)
            return null;
        const updatedTask = { ...task, ...updates, updatedAt: new Date() };
        this.tasks.set(id, updatedTask);
        this.eventEmitter.emit('task.updated', updatedTask);
        return updatedTask;
    }
    async deleteTask(id) {
        // Mock implementation
        const deleted = this.tasks.delete(id);
        if (deleted) {
            this.eventEmitter.emit('task.deleted', { id });
        }
        return deleted;
    }
    async getTasks(filters) {
        // Mock implementation
        let tasks = Array.from(this.tasks.values());
        if (filters?.status) {
            tasks = tasks.filter(task => task.status === filters.status);
        }
        if (filters?.assignedTo) {
            tasks = tasks.filter(task => task.assignedTo === filters.assignedTo);
        }
        return tasks;
    }
    async completeTask(id) {
        // Mock implementation
        return this.updateTask(id, { status: 'completed', completedAt: new Date() });
    }
    async assignTask(id, assignedTo) {
        // Mock implementation
        return this.updateTask(id, { assignedTo });
    }
    async getTaskStats() {
        // Mock implementation
        const tasks = Array.from(this.tasks.values());
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length
        };
    }
};
TaskService = TaskService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], TaskService);
export { TaskService };
