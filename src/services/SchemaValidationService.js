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
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';
import { Logger } from '../common/logger.service.js';
const workflowSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    version: z.string(),
    tasks: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        configuration: z.object({
            requirements: z.object({
                capabilities: z.array(z.string())
            }),
            parameters: z.record(z.unknown()).optional()
        }),
        dependencies: z.array(z.string()).optional()
    })),
    metadata: z.record(z.unknown()).optional()
});
const agentSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    capabilities: z.array(z.string()),
    status: z.enum(['active', 'inactive', 'busy']),
    metadata: z.record(z.unknown()).optional()
});
let SchemaValidationService = class SchemaValidationService {
    prisma;
    logger;
    constructor(prisma, logger) {
        this.prisma = prisma;
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
        const existingCapabilities = await this.prisma.capability.findMany({
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
        const existingCapabilities = await this.prisma.capability.findMany({
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
SchemaValidationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, Logger])
], SchemaValidationService);
export { SchemaValidationService };
