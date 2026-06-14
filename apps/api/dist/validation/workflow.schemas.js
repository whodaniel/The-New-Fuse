"use strict";
/**
 * Workflow Validation Schemas - Request validation using Joi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowValidationSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
// Node schema
const nodeSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
    type: joi_1.default.string().valid('agent', 'mcpTool', 'input', 'output', 'condition', 'transform', 'notification', 'a2a', 'loop', 'subworkflow').required(),
    position: joi_1.default.object({
        x: joi_1.default.number().required(),
        y: joi_1.default.number().required()
    }).required(),
    data: joi_1.default.object({
        name: joi_1.default.string().required(),
        type: joi_1.default.string().required(),
        config: joi_1.default.object().default({})
    }).required()
});
// Edge schema
const edgeSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
    source: joi_1.default.string().required(),
    target: joi_1.default.string().required(),
    sourceHandle: joi_1.default.string().optional(),
    targetHandle: joi_1.default.string().optional(),
    data: joi_1.default.object().optional()
});
// Base workflow schema
const baseWorkflowSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(255).required(),
    description: joi_1.default.string().max(1000).optional(),
    nodes: joi_1.default.array().items(nodeSchema).min(1).required(),
    edges: joi_1.default.array().items(edgeSchema).required(),
    status: joi_1.default.string().valid('draft', 'active', 'paused', 'archived').default('draft'),
    tags: joi_1.default.array().items(joi_1.default.string()).default([]),
    metadata: joi_1.default.object().optional()
});
exports.workflowValidationSchemas = {
    // Create workflow
    create: {
        body: baseWorkflowSchema.keys({
            version: joi_1.default.number().integer().min(1).default(1),
            createdBy: joi_1.default.string().optional() // Will be set from auth context
        })
    },
    // Update workflow
    update: {
        params: joi_1.default.object({
            id: joi_1.default.string().uuid().required()
        }),
        body: baseWorkflowSchema.keys({
            version: joi_1.default.number().integer().min(1).optional()
        }).fork(['name', 'nodes', 'edges'], (schema) => schema.optional())
    },
    // Execute workflow
    execute: {
        body: joi_1.default.object({
            workflowId: joi_1.default.string().uuid().required(),
            input: joi_1.default.object().default({})
        })
    },
    // Validate workflow
    validate: {
        body: baseWorkflowSchema
    },
    // Create from template
    fromTemplate: {
        body: joi_1.default.object({
            templateId: joi_1.default.string().uuid().required(),
            name: joi_1.default.string().min(1).max(255).required(),
            description: joi_1.default.string().max(1000).optional()
        })
    },
    // Query parameters for list endpoints
    list: {
        query: joi_1.default.object({
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(100).default(20),
            status: joi_1.default.string().valid('draft', 'active', 'paused', 'archived').optional(),
            search: joi_1.default.string().max(255).optional()
        })
    },
    // Execution query parameters
    executionList: {
        query: joi_1.default.object({
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(100).default(20),
            status: joi_1.default.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').optional()
        })
    }
};
//# sourceMappingURL=workflow.schemas.js.map