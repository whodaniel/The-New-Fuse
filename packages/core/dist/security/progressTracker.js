var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProgressTrackerService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let ProgressTrackerService = ProgressTrackerService_1 = class ProgressTrackerService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(ProgressTrackerService_1.name);
        this.tasks = new Map();
    }
    /**
     * Starts tracking a new task.
     */
    startTask(taskId, metadata) {
        if (this.tasks.has(taskId)) {
            this.logger.warn(`Task with ID "${taskId}" is already being tracked.`);
            return this.tasks.get(taskId);
        }
        const task = {
            taskId,
            status: 'pending',
            progress: 0,
            metadata,
        };
        this.tasks.set(taskId, task);
        this.eventEmitter.emit('task.started', task);
        this.logger.log(`Task started: ${taskId}`);
        return task;
    }
    /**
     * Updates the progress of an existing task.
     */
    updateProgress(taskId, progress, message) {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.logger.warn(`Task with ID "${taskId}" not found for progress update.`);
            return null;
        }
        task.progress = Math.max(0, Math.min(100, progress));
        task.status = 'in-progress';
        if (message) {
            task.message = message;
        }
        this.eventEmitter.emit('task.progress', task);
        return task;
    }
    /**
     * Completes a task.
     */
    completeTask(taskId, message) {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.logger.warn(`Task with ID "${taskId}" not found for completion.`);
            return null;
        }
        task.status = 'completed';
        task.progress = 100;
        if (message) {
            task.message = message;
        }
        this.eventEmitter.emit('task.completed', task);
        this.logger.log(`Task completed: ${taskId}`);
        return task;
    }
    /**
     * Marks a task as failed.
     */
    failTask(taskId, errorMessage) {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.logger.warn(`Task with ID "${taskId}" not found for failure.`);
            return null;
        }
        task.status = 'failed';
        task.message = errorMessage;
        this.eventEmitter.emit('task.failed', task);
        this.logger.error(`Task failed: ${taskId} - ${errorMessage}`);
        return task;
    }
    /**
     * Retrieves the status of a specific task.
     */
    getTaskStatus(taskId) {
        return this.tasks.get(taskId) || null;
    }
};
ProgressTrackerService = ProgressTrackerService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], ProgressTrackerService);
export { ProgressTrackerService };
//# sourceMappingURL=progressTracker.js.map