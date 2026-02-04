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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPEventService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const mcp_broker_service_tsx_1 = require("../mcp/services/mcp-broker.service.tsx");
const WorkflowMonitoringService_js_1 = require("./WorkflowMonitoringService.js");
const AnalyticsIntegrationService_js_1 = require("./AnalyticsIntegrationService.js");
const MCPErrorHandlingService_js_1 = require("./MCPErrorHandlingService.js");
const logger_service_js_1 = require("../common/logger.service.js");
let MCPEventService = class MCPEventService {
    eventEmitter;
    mcpBroker;
    workflowMonitor;
    analytics;
    errorHandler;
    logger;
    eventHandlers = new Map();
    constructor(eventEmitter, mcpBroker, workflowMonitor, analytics, errorHandler, logger) {
        this.eventEmitter = eventEmitter;
        this.mcpBroker = mcpBroker;
        this.workflowMonitor = workflowMonitor;
        this.analytics = analytics;
        this.errorHandler = errorHandler;
        this.logger = logger;
    }
    async onModuleInit() {
        this.registerSystemEventHandlers();
        await this.initializeEventListeners();
    }
    registerSystemEventHandlers() {
        // Workflow events
        this.on('workflow.started', this.handleWorkflowStart.bind(this));
        this.on('workflow.completed', this.handleWorkflowComplete.bind(this));
        this.on('workflow.failed', this.handleWorkflowFailure.bind(this));
        // Task events
        this.on('task.started', this.handleTaskStart.bind(this));
        this.on('task.completed', this.handleTaskComplete.bind(this));
        this.on('task.failed', this.handleTaskFailure.bind(this));
        // Agent events
        this.on('agent.registered', this.handleAgentRegistration.bind(this));
        this.on('agent.capability.added', this.handleCapabilityUpdate.bind(this));
        this.on('agent.status.changed', this.handleAgentStatusChange.bind(this));
        // Error events
        this.on('error.*', this.handleSystemError.bind(this));
    }
    async initializeEventListeners() {
        try {
            await this.mcpBroker.executeDirective('events', 'subscribe', {
                patterns: [
                    'workflow.*',
                    'task.*',
                    'agent.*',
                    'error.*'
                ],
                callback: (event) => this.processEvent(event)
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize event listeners:', error);
            throw error;
        }
    }
    async emit(eventType, payload, metadata) {
        const event = {
            type: eventType,
            source: 'mcp-event-service',
            timestamp: Date.now(),
            payload,
            metadata
        };
        try {
            await this.processEvent(event);
            await this.mcpBroker.executeDirective('events', 'publish', { event });
        }
        catch (error) {
            this.logger.error(`Error emitting event ${eventType}:`, error);
            throw error;
        }
    }
    on(eventPattern, handler) {
        if (!this.eventHandlers.has(eventPattern)) {
            this.eventHandlers.set(eventPattern, new Set());
        }
        this.eventHandlers.get(eventPattern)?.add(handler);
    }
    off(eventPattern, handler) {
        this.eventHandlers.get(eventPattern)?.delete(handler);
    }
    async processEvent(event) {
        try {
            const handlers = this.findMatchingHandlers(event.type);
            await Promise.all(Array.from(handlers).map(handler => handler(event).catch(error => this.handleEventProcessingError(error, event))));
        }
        catch (error) {
            await this.handleEventProcessingError(error, event);
        }
    }
    findMatchingHandlers(eventType) {
        const handlers = new Set();
        this.eventHandlers.forEach((eventHandlers, pattern) => {
            if (this.matchesPattern(eventType, pattern)) {
                eventHandlers.forEach(handler => handlers.add(handler));
            }
        });
        return handlers;
    }
    matchesPattern(eventType, pattern) {
        const patternParts = pattern.split('.');
        const eventParts = eventType.split('.');
        if (patternParts.length !== eventParts.length && patternParts[patternParts.length - 1] !== '*') {
            return false;
        }
        return patternParts.every((part, index) => part === '*' || part === eventParts[index]);
    }
    async handleEventProcessingError(error, event) {
        await this.errorHandler.handleWorkflowError({
            error,
            timestamp: Date.now(),
            context: {
                eventType: event.type,
                eventPayload: event.payload
            }
        });
    }
    // Event handlers
    async handleWorkflowStart(event) {
        const { workflowId } = event.payload;
        await this.workflowMonitor.trackWorkflowExecution(workflowId, {
            type: 'STARTED',
            timestamp: event.timestamp
        });
    }
    async handleWorkflowComplete(event) {
        const { workflowId } = event.payload;
        await Promise.all([
            this.workflowMonitor.trackWorkflowExecution(workflowId, {
                type: 'COMPLETED',
                timestamp: event.timestamp
            }),
            this.analytics.trackWorkflowPerformance(workflowId)
        ]);
    }
    async handleWorkflowFailure(event) {
        const { workflowId, error } = event.payload;
        await this.errorHandler.handleWorkflowError({
            workflowId,
            error,
            timestamp: event.timestamp
        });
    }
    async handleTaskStart(event) {
        const { workflowId, taskId } = event.payload;
        await this.workflowMonitor.trackWorkflowExecution(workflowId, {
            type: 'TASK_STARTED',
            taskId,
            timestamp: event.timestamp
        });
    }
    async handleTaskComplete(event) {
        const { workflowId, taskId, result } = event.payload;
        await this.workflowMonitor.trackWorkflowExecution(workflowId, {
            type: 'TASK_COMPLETED',
            taskId,
            result,
            timestamp: event.timestamp
        });
    }
    async handleTaskFailure(event) {
        const { workflowId, taskId, error } = event.payload;
        await this.errorHandler.handleWorkflowError({
            workflowId,
            taskId,
            error,
            timestamp: event.timestamp
        });
    }
    async handleAgentRegistration(event) {
        const { agentId, capabilities } = event.payload;
        await this.analytics.trackToolUsage('agent_registration');
        this.logger.info(`Agent registered: ${agentId}`, { capabilities });
    }
    async handleCapabilityUpdate(event) {
        const { agentId, capability } = event.payload;
        await this.analytics.trackToolUsage('capability_update');
        this.logger.info(`Agent capability updated: ${agentId}`, { capability });
    }
    async handleAgentStatusChange(event) {
        const { agentId, status } = event.payload;
        await this.analytics.trackToolUsage('agent_status_change');
        this.logger.info(`Agent status changed: ${agentId}`, { status });
    }
    async handleSystemError(event) {
        await this.errorHandler.handleWorkflowError({
            error: event.payload,
            timestamp: event.timestamp,
            context: event.metadata
        });
    }
};
exports.MCPEventService = MCPEventService;
exports.MCPEventService = MCPEventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        mcp_broker_service_tsx_1.MCPBrokerService,
        WorkflowMonitoringService_js_1.WorkflowMonitoringService,
        AnalyticsIntegrationService_js_1.AnalyticsIntegrationService,
        MCPErrorHandlingService_js_1.MCPErrorHandlingService,
        logger_service_js_1.Logger])
], MCPEventService);
//# sourceMappingURL=MCPEventService.js.map