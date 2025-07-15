import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
export interface ErrorContext {
    workflowId?: string;
    taskId?: string;
    toolName?: string;
    error: Error | unknown;
    timestamp: number;
    context?: Record<string, unknown>;
}
export declare class MCPErrorHandlingService {
    private readonly mcpBroker;
    private readonly workflowMonitor;
    private readonly logger;
    constructor(mcpBroker: MCPBrokerService, workflowMonitor: WorkflowMonitoringService, logger: Logger);
    handleWorkflowError(context: ErrorContext): Promise<void>;
    private notifyAgents;
    private attemptRecovery;
    private determineRecoveryStrategy;
    private executeRecoveryStrategy;
    private retryExecution;
    private executeFallback;
    private findAlternateResource;
}
//# sourceMappingURL=MCPErrorHandlingService.d.ts.map