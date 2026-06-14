var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PerformanceService_1;
import { Injectable, Logger } from '@nestjs/common';
let PerformanceService = PerformanceService_1 = class PerformanceService {
    constructor() {
        this.logger = new Logger(PerformanceService_1.name);
        this.timers = new Map();
    }
    start(name) {
        this.logger.log(`Starting performance measurement for: ${name}`);
        this.timers.set(name, Date.now());
    }
    end(name) {
        const startTime = this.timers.get(name);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.logger.log(`Performance measurement for ${name} ended. Duration: ${duration}ms`);
            this.timers.delete(name);
            // In a real implementation, you would send this to a monitoring service.
        }
        else {
            this.logger.warn(`Performance measurement for ${name} was not started.`);
        }
    }
};
PerformanceService = PerformanceService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], PerformanceService);
export { PerformanceService };
//# sourceMappingURL=performance.js.map