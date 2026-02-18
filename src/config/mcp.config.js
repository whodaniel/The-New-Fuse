'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MCPConfig =
  exports.WorkflowStepSchema =
  exports.AgentCapabilitySchema =
  exports.MCPMessageSchema =
    void 0;
const zod_1 = require('zod');
exports.MCPMessageSchema = zod_1.z.object({
  source: zod_1.z.string(),
  target: zod_1.z.string(),
  context: zod_1.z.object({
    type: zod_1.z.enum(['request', 'response', 'event']),
    payload: zod_1.z.any(),
    metadata: zod_1.z.object({
      timestamp: zod_1.z.number(),
      correlationId: zod_1.z.string(),
      capabilities: zod_1.z.array(zod_1.z.string()),
    }),
  }),
});
exports.AgentCapabilitySchema = zod_1.z.object({
  name: zod_1.z.string(),
  actions: zod_1.z.array(zod_1.z.string()),
  parameters: zod_1.z.record(zod_1.z.unknown()),
});
exports.WorkflowStepSchema = zod_1.z.object({
  id: zod_1.z.string(),
  agentId: zod_1.z.string(),
  action: zod_1.z.string(),
  inputs: zod_1.z.record(zod_1.z.unknown()),
  outputs: zod_1.z.record(zod_1.z.unknown()),
  conditions: zod_1.z
    .object({
      pre: zod_1.z.record(zod_1.z.unknown()).optional(),
      post: zod_1.z.record(zod_1.z.unknown()).optional(),
    })
    .optional(),
});
exports.MCPConfig = {
  validation: {
    timeout: 5000,
    retryAttempts: 3,
    maxPayloadSize: 1024 * 1024,
  },
  security: {
    requireAuthentication: true,
    encryptPayload: true,
  },
  monitoring: {
    enableMetrics: true,
    logLevel: 'info',
  },
};
//# sourceMappingURL=mcp.config.js.map
