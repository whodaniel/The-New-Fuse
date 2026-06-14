var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReliabilityMetricsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let ReliabilityMetricsService = ReliabilityMetricsService_1 = class ReliabilityMetricsService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(ReliabilityMetricsService_1.name);
        this.negotiationAttempts = 0;
        this.negotiationSuccesses = 0;
        this.schemaErrors = 0;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.eventEmitter.on('protocol.negotiation.attempt', () => this.negotiationAttempts++);
        this.eventEmitter.on('protocol.negotiation.success', () => this.negotiationSuccesses++);
        this.eventEmitter.on('protocol.schema.error', () => this.schemaErrors++);
    }
    getNegotiationSuccessRate() {
        if (this.negotiationAttempts === 0) {
            return 1;
        }
        return this.negotiationSuccesses / this.negotiationAttempts;
    }
    getSchemaErrorRate() {
        // Assuming a total number of messages for calculating the rate
        const totalMessages = 1000; // Placeholder
        return this.schemaErrors / totalMessages;
    }
};
ReliabilityMetricsService = ReliabilityMetricsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], ReliabilityMetricsService);
export { ReliabilityMetricsService };
//# sourceMappingURL=ReliabilityMetricsService.js.map