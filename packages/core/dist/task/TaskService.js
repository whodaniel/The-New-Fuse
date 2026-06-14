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
import { v4 as uuidv4 } from 'uuid';
let TaskService = TaskService_1 = class TaskService {
    constructor() {
        this.logger = new Logger(TaskService_1.name);
        this.tasks = [];
    }
    async createTask(taskData) {
        const task = {
            id: uuidv4(),
            status: 'PENDING',
            ...taskData,
        };
        this.tasks.push(task);
        this.logger.log(`Task created: ${task.id}`);
        return task;
    }
    async getTask(taskId) {
        return this.tasks.find((task) => task.id === taskId);
    }
    async updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex === -1) {
            return undefined;
        }
        const updatedTask = { ...this.tasks[taskIndex], ...updates };
        this.tasks[taskIndex] = updatedTask;
        this.logger.log(`Task updated: ${taskId}`);
        return updatedTask;
    }
    async deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex === -1) {
            return false;
        }
        this.tasks.splice(taskIndex, 1);
        this.logger.log(`Task deleted: ${taskId}`);
        return true;
    }
};
TaskService = TaskService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], TaskService);
export { TaskService };
//# sourceMappingURL=TaskService.js.map