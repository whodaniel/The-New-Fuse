var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let TaskActivityService = class TaskActivityService {
    constructor() {
        this.activities = new Map();
    }
    logActivity(taskId, userId, action, details) {
        const activity = {
            id: `activity-${Date.now()}`,
            taskId,
            userId,
            action,
            details,
            timestamp: new Date()
        };
        const taskActivities = this.activities.get(taskId) || [];
        taskActivities.push(activity);
        this.activities.set(taskId, taskActivities);
        return activity;
    }
    getTaskActivities(taskId) {
        return this.activities.get(taskId) || [];
    }
    getAllActivities() {
        const allActivities = [];
        for (const activities of this.activities.values()) {
            allActivities.push(...activities);
        }
        return allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getRecentActivities(limit = 10) {
        return this.getAllActivities().slice(0, limit);
    }
};
TaskActivityService = __decorate([
    Injectable()
], TaskActivityService);
export { TaskActivityService };
//# sourceMappingURL=TaskActivityService.js.map