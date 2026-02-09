import Joi from 'joi';

// Define role values since the enum isn't available as a runtime value
const agentRoleValues = ['ADMIN', 'USER', 'GUEST'];

// Define capability values since the enum isn't available as a runtime value
const agentCapabilityValues = [
  'CHAT',
  'FILE_PROCESSING', 
  'DATA_ANALYSIS',
  'CODE_GENERATION',
  'WORKFLOW_ORCHESTRATION',
  'API_INTEGRATION',
  'DATABASE_OPERATIONS',
  'MONITORING',
  'SECURITY',
  'TESTING'
];

// Agent schema definition
export const agentSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  type: Joi.string().required(),
  description: Joi.string().max(500),
  role: Joi.string().valid(...agentRoleValues).optional(),
  capabilities: Joi.array().items(
    Joi.string().valid(...agentCapabilityValues)
  ).optional(),
  configuration: Joi.object().optional(),
  enabled: Joi.boolean().default(true),
  // Add any other fields needed for your agent
});

// Update agent schema (for updates)
export const updateAgentSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  type: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  role: Joi.string().valid(...agentRoleValues).optional(),
  capabilities: Joi.array().items(
    Joi.string().valid(...agentCapabilityValues)
  ).optional(),
  configuration: Joi.object().optional(),
  enabled: Joi.boolean().optional(),
});
