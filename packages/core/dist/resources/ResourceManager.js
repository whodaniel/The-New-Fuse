var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ResourceManager_1;
import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
let ResourceManager = ResourceManager_1 = class ResourceManager {
    constructor() {
        this.logger = new Logger(ResourceManager_1.name);
        this.allocatedResources = new Map();
        this.monitoringInterval = setInterval(() => this.logResourceUsage(), 300000); // Log every 5 minutes
        this.logResourceUsage(); // Log initial usage
    }
    onModuleDestroy() {
        clearInterval(this.monitoringInterval);
    }
    getCurrentUsage() {
        return {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        };
    }
    allocateResource(consumerId, resource) {
        if (this.allocatedResources.has(consumerId)) {
            this.logger.warn(`Consumer '${consumerId}' has already allocated a resource.`);
            return false;
        }
        this.allocatedResources.set(consumerId, resource);
        this.logger.log(`Resource allocated for consumer: ${consumerId}`);
        return true;
    }
    getResource(consumerId) {
        return this.allocatedResources.get(consumerId);
    }
    releaseResource(consumerId) {
        if (!this.allocatedResources.has(consumerId)) {
            this.logger.warn(`No resource allocated for consumer '${consumerId}' to release.`);
            return false;
        }
        this.allocatedResources.delete(consumerId);
        this.logger.log(`Resource released for consumer: ${consumerId}`);
        return true;
    }
    logResourceUsage() {
        const usage = this.getCurrentUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsagePercentage = ((totalMemory - freeMemory) / totalMemory) * 100;
        this.logger.log('System Resource Usage:', {
            ...usage,
            totalMemory: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
            freeMemory: `${(freeMemory / 1024 / 1024).toFixed(2)} MB`,
            memoryUsagePercentage: `${memoryUsagePercentage.toFixed(2)}%`,
        });
    }
};
ResourceManager = ResourceManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ResourceManager);
export { ResourceManager };
//# sourceMappingURL=ResourceManager.js.map