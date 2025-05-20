"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCardSchema = void 0;
const zod_1 = require("zod");
const agent_js_1 = require("./agent.js");
exports.agentCardSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    version: zod_1.z.string(),
    description: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.nativeEnum(agent_js_1.AgentCapability)),
    role: zod_1.z.nativeEnum(agent_js_1.AgentRole),
    type: zod_1.z.nativeEnum(agent_js_1.AgentType),
    endpoints: zod_1.z.object({
        discovery: zod_1.z.string().url(),
        messaging: zod_1.z.string().url(),
        metrics: zod_1.z.string().url().optional(),
    }),
    protocols: zod_1.z.array(zod_1.z.string()),
    security: zod_1.z.object({
        authentication: zod_1.z.enum(['none', 'api_key', 'oauth2', 'jwt']),
        encryption: zod_1.z.boolean(),
        rateLimit: zod_1.z.number().optional(),
    }),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
