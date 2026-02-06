import { DatabaseService } from '../drizzle/drizzle.service.js';
import { Logger } from '../common/logger.service.js';
export declare class SchemaValidationService {
    private readonly drizzle;
    private readonly logger;
    constructor(drizzle: DatabaseService, logger: Logger);
    validateWorkflow(workflow: unknown): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    validateAgent(agent: unknown): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    private validateTaskDependencies;
    private validateCapabilities;
    private validateAgentCapabilities;
    migrateWorkflow(workflow: unknown): Promise<{
        success: boolean;
        migratedWorkflow?: any;
        errors?: string[];
    }>;
    private transformWorkflow;
}
//# sourceMappingURL=SchemaValidationService.d.ts.map