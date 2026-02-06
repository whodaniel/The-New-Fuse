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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidationService = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const drizzle_service_js_1 = require("../drizzle/drizzle.service.js");
const logger_service_js_1 = require("../common/logger.service.js");
const workflowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string(),
    tasks: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        configuration: zod_1.z.object({
            requirements: zod_1.z.object({
                capabilities: zod_1.z.array(zod_1.z.string())
            }),
            parameters: zod_1.z.record(zod_1.z.unknown()).optional()
        }),
        dependencies: zod_1.z.array(zod_1.z.string()).optional()
    })),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
const agentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    status: zod_1.z.enum(['active', 'inactive', 'busy']),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
let SchemaValidationService = class SchemaValidationService {
    drizzle;
    logger;
    constructor(drizzle, logger) {
        this.drizzle = drizzle;
        this.logger = logger;
    }
    async validateWorkflow(workflow) {
        try {
            const result = workflowSchema.safeParse(workflow);
            if (!result.success) {
                return {
                    valid: false,
                    errors: result.error.errors.map(e => e.message)
                };
            }
            // Validate task dependencies
            const errors = await this.validateTaskDependencies(result.data);
            if (errors.length > 0) {
                return { valid: false, errors };
            }
            // Validate capabilities exist
            const capabilityErrors = await this.validateCapabilities(result.data);
            if (capabilityErrors.length > 0) {
                return { valid: false, errors: capabilityErrors };
            }
            return { valid: true };
        }
        catch (error) {
            this.logger.error('Error validating workflow:', error);
            return {
                valid: false,
                errors: [error.message]
            };
        }
    }
    async validateAgent(agent) {
        try {
            const result = agentSchema.safeParse(agent);
            if (!result.success) {
                return {
                    valid: false,
                    errors: result.error.errors.map(e => e.message)
                };
            }
            // Validate capabilities exist in registry
            const capabilityErrors = await this.validateAgentCapabilities(result.data);
            if (capabilityErrors.length > 0) {
                return { valid: false, errors: capabilityErrors };
            }
            return { valid: true };
        }
        catch (error) {
            this.logger.error('Error validating agent:', error);
            return {
                valid: false,
                errors: [error.message]
            };
        }
    }
    async validateTaskDependencies(workflow) {
        const errors = [];
        const taskIds = new Set(workflow.tasks.map(t => t.id));
        for (const task of workflow.tasks) {
            if (task.dependencies) {
                for (const depId of task.dependencies) {
                    if (!taskIds.has(depId)) {
                        errors.push(`Task ${task.id} has invalid dependency: ${depId}`);
                    }
                }
            }
        }
        return errors;
    }
    async validateCapabilities(workflow) {
        const errors = [];
        const existingCapabilities = await this.drizzle.capability.findMany({
            select: { name: true }
        });
        const capabilitySet = new Set(existingCapabilities.map(c => c.name));
        for (const task of workflow.tasks) {
            for (const capability of task.configuration.requirements.capabilities) {
                if (!capabilitySet.has(capability)) {
                    errors.push(`Task ${task.id} requires unknown capability: ${capability}`);
                }
            }
        }
        return errors;
    }
    async validateAgentCapabilities(agent) {
        const errors = [];
        const existingCapabilities = await this.drizzle.capability.findMany({
            select: { name: true }
        });
        const capabilitySet = new Set(existingCapabilities.map(c => c.name));
        for (const capability of agent.capabilities) {
            if (!capabilitySet.has(capability)) {
                errors.push(`Agent ${agent.id} claims unknown capability: ${capability}`);
            }
        }
        return errors;
    }
    async migrateWorkflow(workflow) {
        try {
            const validation = await this.validateWorkflow(workflow);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }
            // Perform any necessary transformations
            const migratedWorkflow = await this.transformWorkflow(workflow);
            return {
                success: true,
                migratedWorkflow
            };
        }
        catch (error) {
            this.logger.error('Error migrating workflow:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }
    async transformWorkflow(workflow) {
        // Add any necessary transformations here
        // For example, adding new required fields or updating field formats
        return {
            ...workflow,
            version: workflow.version || '1.0.0',
            metadata: {
                ...workflow.metadata,
                migrated: true,
                migrationTimestamp: Date.now()
            }
        };
    }
};
exports.SchemaValidationService = SchemaValidationService;
exports.SchemaValidationService = SchemaValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof drizzle_service_js_1.DatabaseService !== "undefined" && drizzle_service_js_1.DatabaseService) === "function" ? _a : Object, logger_service_js_1.Logger])
], SchemaValidationService);
//# sourceMappingURL=SchemaValidationService.js.map