var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SystemMonitor_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let SystemMonitor = SystemMonitor_1 = class SystemMonitor {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(SystemMonitor_1.name);
    }
    async getSystemHealth() {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
        };
    }
    async getSecurityAlerts() {
        return [];
    }
    async createAlert(alert) {
        const newAlert = {
            id: Date.now().toString(),
            timestamp: new Date(),
            ...alert,
        };
        this.eventEmitter.emit('security.alert', newAlert);
        return newAlert;
    }
};
SystemMonitor = SystemMonitor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], SystemMonitor);
export { SystemMonitor };
//# sourceMappingURL=SystemMonitor.js.map