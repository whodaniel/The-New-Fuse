var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DirectorMonitoringService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let DirectorMonitoringService = DirectorMonitoringService_1 = class DirectorMonitoringService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(DirectorMonitoringService_1.name);
        this.directorStatuses = new Map();
    }
    async updateDirectorStatus(status) {
        try {
            this.directorStatuses.set(status.directorId, status);
            this.eventEmitter.emit('director.status.updated', status);
        }
        catch (error) {
            this.logger.error('Failed to update director status', error);
        }
    }
    async getDirectorStatus(directorId) {
        return this.directorStatuses.get(directorId);
    }
    async getAllDirectorStatuses() {
        return Array.from(this.directorStatuses.values());
    }
    async checkDirectorHealth(directorId) {
        const status = this.directorStatuses.get(directorId);
        const issues = [];
        if (!status) {
            return {
                directorId,
                healthy: false,
                issues: ['Director not found'],
                uptime: 0,
                responseTime: 0
            };
        }
        const timeSinceHeartbeat = Date.now() - status.lastHeartbeat.getTime();
        if (timeSinceHeartbeat > 60000) {
            issues.push('No heartbeat received in over 1 minute');
        }
        if (status.currentTasks >= status.capacity) {
            issues.push('Director at maximum capacity');
        }
        return {
            directorId,
            healthy: issues.length === 0,
            issues,
            uptime: Date.now() - status.lastHeartbeat.getTime(),
            responseTime: Math.random() * 100
        };
    }
};
DirectorMonitoringService = DirectorMonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], DirectorMonitoringService);
export { DirectorMonitoringService };
//# sourceMappingURL=DirectorMonitoringService.js.map