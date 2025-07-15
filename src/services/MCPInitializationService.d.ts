import { OnModuleInit } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMCPIntegrationService } from './WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from './AnalyticsIntegrationService.js';
import { SchemaValidationService } from './SchemaValidationService.js';
import { Logger } from '../common/logger.service.js';
export declare class MCPInitializationService implements OnModuleInit {
    private readonly mcpBroker;
    private readonly workflowIntegration;
    private readonly analytics;
    private readonly schemaValidation;
    private readonly logger;
    constructor(mcpBroker: MCPBrokerService, workflowIntegration: WorkflowMCPIntegrationService, analytics: AnalyticsIntegrationService, schemaValidation: SchemaValidationService, logger: Logger);
    onModuleInit(): Promise<void>;
    private initializeMCPSystem;
    private initializeCoreMCP;
    private registerSystemCapabilities;
    private initializeIntegrations;
    private validateSystemState;
    private validateMCPBroker;
    private validateWorkflowIntegration;
    private validateAnalytics;
    private validateSchemaSystem;
}
//# sourceMappingURL=MCPInitializationService.d.ts.map