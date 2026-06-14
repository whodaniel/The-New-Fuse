var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let MonitoringService = MonitoringService_1 = class MonitoringService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(MonitoringService_1.name);
        this.events = [];
        this.maxEvents = 10000;
    }
    recordEvent(type, data, severity = 'low') {
        const event = {
            type,
            timestamp: new Date(),
            data,
            severity
        };
        this.events.push(event);
        // Keep only the most recent events
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        // Emit event for real-time processing
        this.eventEmitter.emit('monitoring.event', event);
        // Log critical events
        if (severity === 'critical') {
            this.logger.error(`Critical monitoring event: ${type}`, data);
        }
    }
    getEvents(type, limit) {
        let filteredEvents = type
            ? this.events.filter(event => event.type === type)
            : this.events;
        if (limit) {
            filteredEvents = filteredEvents.slice(-limit);
        }
        return filteredEvents;
    }
    async getSystemHealth() {
        const checks = {
            database: await this.checkDatabase(),
            cache: await this.checkCache(),
            external_apis: await this.checkExternalAPIs(),
            memory: await this.checkMemory(),
            cpu: await this.checkCPU()
        };
        const healthyChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        let status;
        if (healthyChecks === totalChecks) {
            status = 'healthy';
        }
        else if (healthyChecks >= totalChecks * 0.7) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        const health = {
            status,
            checks,
            timestamp: new Date()
        };
        this.recordEvent('system.health_check', health, status === 'unhealthy' ? 'critical' : 'low');
        return health;
    }
    async checkDatabase() {
        try {
            // Mock database check
            return true;
        }
        catch (error) {
            this.logger.error('Database health check failed', error);
            return false;
        }
    }
    async checkCache() {
        try {
            // Mock cache check
            return true;
        }
        catch (error) {
            this.logger.error('Cache health check failed', error);
            return false;
        }
    }
    async checkExternalAPIs() {
        try {
            // Mock external API check
            return true;
        }
        catch (error) {
            this.logger.error('External APIs health check failed', error);
            return false;
        }
    }
    async checkMemory() {
        try {
            const memUsage = process.memoryUsage();
            const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
            const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
            // Consider unhealthy if using more than 80% of heap
            return (heapUsedMB / heapTotalMB) < 0.8;
        }
        catch (error) {
            this.logger.error('Memory health check failed', error);
            return false;
        }
    }
    async checkCPU() {
        try {
            // Mock CPU check - in real implementation, would check CPU usage
            return true;
        }
        catch (error) {
            this.logger.error('CPU health check failed', error);
            return false;
        }
    }
    getEventsSummary() {
        const bySeverity = {};
        const byType = {};
        for (const event of this.events) {
            bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
            byType[event.type] = (byType[event.type] || 0) + 1;
        }
        return {
            total: this.events.length,
            bySeverity,
            byType
        };
    }
    clearEvents(olderThan) {
        if (olderThan) {
            this.events = this.events.filter(event => event.timestamp > olderThan);
        }
        else {
            this.events = [];
        }
    }
};
MonitoringService = MonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], MonitoringService);
export { MonitoringService };
//# sourceMappingURL=MonitoringService.js.map