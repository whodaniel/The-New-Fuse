import { PrismaService } from '../prisma/prisma.service.js';
import { Logger } from '../common/logger.service.js';
export declare class SchemaValidationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService, logger: Logger);
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