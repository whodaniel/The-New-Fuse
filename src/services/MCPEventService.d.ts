import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { AnalyticsIntegrationService } from './AnalyticsIntegrationService.js';
import { MCPErrorHandlingService } from './MCPErrorHandlingService.js';
import { Logger } from '../common/logger.service.js';
export interface MCPEvent {
    type: string;
    source: string;
    timestamp: number;
    payload: any;
    metadata?: Record<string, unknown>;
}
export declare class MCPEventService implements OnModuleInit {
    private readonly eventEmitter;
    private readonly mcpBroker;
    private readonly workflowMonitor;
    private readonly analytics;
    private readonly errorHandler;
    private readonly logger;
    private readonly eventHandlers;
    constructor(eventEmitter: EventEmitter2, mcpBroker: MCPBrokerService, workflowMonitor: WorkflowMonitoringService, analytics: AnalyticsIntegrationService, errorHandler: MCPErrorHandlingService, logger: Logger);
    onModuleInit(): Promise<void>;
    private registerSystemEventHandlers;
    private initializeEventListeners;
    emit(eventType: string, payload: any, metadata?: Record<string, unknown>): Promise<void>;
    on(eventPattern: string, handler: (event: MCPEvent) => Promise<void>): void;
    off(eventPattern: string, handler: (event: MCPEvent) => Promise<void>): void;
    private processEvent;
    private findMatchingHandlers;
    private matchesPattern;
    private handleEventProcessingError;
    private handleWorkflowStart;
    private handleWorkflowComplete;
    private handleWorkflowFailure;
    private handleTaskStart;
    private handleTaskComplete;
    private handleTaskFailure;
    private handleAgentRegistration;
    private handleCapabilityUpdate;
    private handleAgentStatusChange;
    private handleSystemError;
}
//# sourceMappingURL=MCPEventService.d.ts.map