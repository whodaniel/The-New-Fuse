import { WorkflowMCPIntegrationService } from '../services/WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from '../services/AnalyticsIntegrationService.js';
import { SchemaValidationService } from '../services/SchemaValidationService.js';
import { Logger } from '../common/logger.service.js';
export declare class MCPWorkflowModule {
    private readonly workflowMCPIntegration;
    private readonly analytics;
    private readonly schemaValidation;
    private readonly logger;
    constructor(workflowMCPIntegration: WorkflowMCPIntegrationService, analytics: AnalyticsIntegrationService, schemaValidation: SchemaValidationService, logger: Logger);
    private initializeModule;
    private setupValidationHooks;
}
//# sourceMappingURL=MCPWorkflowModule.d.ts.map