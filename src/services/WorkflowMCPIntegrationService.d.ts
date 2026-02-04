import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
interface MCPToolDefinition {
    name: string;
    description: string;
    capabilities: string[];
    parameters?: Record<string, unknown>;
}
export declare class WorkflowMCPIntegrationService {
    private readonly mcpBroker;
    private readonly workflowMonitor;
    private readonly logger;
    constructor(mcpBroker: MCPBrokerService, workflowMonitor: WorkflowMonitoringService, logger: Logger);
    getAvailableMCPTools(): Promise<MCPToolDefinition[]>;
    executeMCPTool(workflowId: string, toolName: string, params: Record<string, unknown>): Promise<any>;
    validateToolCompatibility(toolName: string, requiredCapabilities: string[]): Promise<boolean>;
    registerWorkflowAsAgent(workflowId: string, capabilities: string[]): Promise<void>;
    subscribeToToolEvents(workflowId: string, callback: (event: any) => void): Promise<void>;
    unsubscribeFromToolEvents(workflowId: string): Promise<void>;
}
export {};
//# sourceMappingURL=WorkflowMCPIntegrationService.d.ts.map