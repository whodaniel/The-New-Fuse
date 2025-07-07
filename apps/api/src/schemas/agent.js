"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgentSchema = exports.agentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
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
exports.agentSchema = joi_1.default.object({
    name: joi_1.default.string().required().min(3).max(100),
    type: joi_1.default.string().required(),
    description: joi_1.default.string().max(500),
    role: joi_1.default.string().valid(...agentRoleValues).optional(),
    capabilities: joi_1.default.array().items(joi_1.default.string().valid(...agentCapabilityValues)).optional(),
    configuration: joi_1.default.object().optional(),
    enabled: joi_1.default.boolean().default(true),
    // Add any other fields needed for your agent
});
// Update agent schema (for updates)
exports.updateAgentSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100).optional(),
    type: joi_1.default.string().optional(),
    description: joi_1.default.string().max(500).optional(),
    role: joi_1.default.string().valid(...agentRoleValues).optional(),
    capabilities: joi_1.default.array().items(joi_1.default.string().valid(...agentCapabilityValues)).optional(),
    configuration: joi_1.default.object().optional(),
    enabled: joi_1.default.boolean().optional(),
});
