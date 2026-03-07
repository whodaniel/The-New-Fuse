import * as Joi from 'joi';
import { AgentCapability, AgentRole } from '@the-new-fuse/types';

// Schema for creating a new agent
export const agentSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow('').max(500),
  type: Joi.string().required(),
  role: Joi.string().valid(...Object.values(AgentRole)).optional(),
  capabilities: Joi.array().items(
    Joi.string().valid(...Object.values(AgentCapability))
  ).optional(),
  systemPrompt: Joi.string().optional().allow('').max(2000),
  configuration: Joi.object().optional()
});

// Schema for updating an existing agent
export const updateAgentSchema = Joi.object({
  name: Joi.string().optional().min(2).max(100),
  description: Joi.string().optional().allow('').max(500),
  type: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(AgentRole)).optional(),
  capabilities: Joi.array().items(
    Joi.string().valid(...Object.values(AgentCapability))
  ).optional(),
  systemPrompt: Joi.string().optional().allow('').max(2000),
  configuration: Joi.object().optional()
}).min(1); // At least one field must be provided for update

// Schema for updating agent status
export const agentStatusSchema = Joi.object({
  status: Joi.string().required()
});