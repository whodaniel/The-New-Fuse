/**
 * Workflow Validation Schemas - Request validation using Joi
 */

import Joi from 'joi';

// Node schema
const nodeSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(
    'agent', 'mcpTool', 'input', 'output', 'condition', 
    'transform', 'notification', 'a2a', 'loop', 'subworkflow'
  ).required(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required()
  }).required(),
  data: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    config: Joi.object().default({})
  }).required()
});

// Edge schema
const edgeSchema = Joi.object({
  id: Joi.string().required(),
  source: Joi.string().required(),
  target: Joi.string().required(),
  sourceHandle: Joi.string().optional(),
  targetHandle: Joi.string().optional(),
  data: Joi.object().optional()
});

// Base workflow schema
const baseWorkflowSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  nodes: Joi.array().items(nodeSchema).min(1).required(),
  edges: Joi.array().items(edgeSchema).required(),
  status: Joi.string().valid('draft', 'active', 'paused', 'archived').default('draft'),
  tags: Joi.array().items(Joi.string()).default([]),
  metadata: Joi.object().optional()
});

export const workflowValidationSchemas = {
  // Create workflow
  create: {
    body: baseWorkflowSchema.keys({
      version: Joi.number().integer().min(1).default(1),
      createdBy: Joi.string().optional() // Will be set from auth context
    })
  },

  // Update workflow
  update: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: baseWorkflowSchema.keys({
      version: Joi.number().integer().min(1).optional()
    }).fork(['name', 'nodes', 'edges'], (schema) => schema.optional())
  },

  // Execute workflow
  execute: {
    body: Joi.object({
      workflowId: Joi.string().uuid().required(),
      input: Joi.object().default({})
    })
  },

  // Validate workflow
  validate: {
    body: baseWorkflowSchema
  },

  // Create from template
  fromTemplate: {
    body: Joi.object({
      templateId: Joi.string().uuid().required(),
      name: Joi.string().min(1).max(255).required(),
      description: Joi.string().max(1000).optional()
    })
  },

  // Query parameters for list endpoints
  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      status: Joi.string().valid('draft', 'active', 'paused', 'archived').optional(),
      search: Joi.string().max(255).optional()
    })
  },

  // Execution query parameters
  executionList: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').optional()
    })
  }
};