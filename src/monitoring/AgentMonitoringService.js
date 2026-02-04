"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ConsolidatedMonitoringService_tsx_1 = require("./ConsolidatedMonitoringService.tsx");
/**
 * AgentMonitoringService
 *
 * This service provides a backward-compatible API for the agent module's MonitoringService
 * while delegating all functionality to the ConsolidatedMonitoringService.
 *
 * This allows for a gradual migration from the agent's MonitoringService to the
 * consolidated monitoring infrastructure without breaking existing code.
 */
let AgentMonitoringService = AgentMonitoringService_1 = class AgentMonitoringService {
    consolidatedMonitoring;
    eventEmitter;
    logger = new common_1.Logger(AgentMonitoringService_1.name);
    constructor(consolidatedMonitoring, eventEmitter) {
        this.consolidatedMonitoring = consolidatedMonitoring;
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        this.logger.log('AgentMonitoringService initialized - delegating to ConsolidatedMonitoringService');
    }
    /**
     * Log a system event
     */
    logEvent(eventType, data) {
        // Maintain backward compatibility with the agent's event naming
        this.eventEmitter.emit('system.log', { type: eventType, data, timestamp: new Date() });
        // Also use the consolidated monitoring service
        this.consolidatedMonitoring.logEvent(eventType, data);
    }
    /**
     * Record a metric
     */
    recordMetric(metricName, value, tags = {}) {
        // Maintain backward compatibility with the agent's event naming
        this.eventEmitter.emit('system.metric', { name: metricName, value, tags, timestamp: new Date() });
        // Also use the consolidated monitoring service
        this.consolidatedMonitoring.recordMetric(metricName, value, tags);
    }
    /**
     * Start monitoring a specific component
     */
    startMonitoring(componentName) {
        this.logEvent('monitoring.start', { component: componentName });
    }
    /**
     * Stop monitoring a specific component
     */
    stopMonitoring(componentName) {
        this.logEvent('monitoring.stop', { component: componentName });
    }
    /**
     * Check system health
     */
    async checkHealth() {
        const healthResult = await this.consolidatedMonitoring.checkHealth();
        // Transform the result to match the agent's MonitoringService format
        return {
            status: healthResult.healthy ? 'ok' : 'error',
            timestamp: new Date(),
            services: healthResult.details,
        };
    }
};
exports.AgentMonitoringService = AgentMonitoringService;
exports.AgentMonitoringService = AgentMonitoringService = AgentMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ConsolidatedMonitoringService_tsx_1.ConsolidatedMonitoringService,
        event_emitter_1.EventEmitter2])
], AgentMonitoringService);
//# sourceMappingURL=AgentMonitoringService.js.map