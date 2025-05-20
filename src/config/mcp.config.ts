import { z } from 'zod';

export const MCPMessageSchema = z.object({
  source: z.string(),
  target: z.string(),
  context: z.object({
    type: z.enum(['request', 'response', 'event']),
    payload: z.any(),
    metadata: z.object({
      timestamp: z.number(),
      correlationId: z.string(),
      capabilities: z.array(z.string())
    })
  })
});

export const AgentCapabilitySchema = z.object({
  name: z.string(),
  actions: z.array(z.string()),
  parameters: z.record(z.unknown())
});

export const WorkflowStepSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  action: z.string(),
  inputs: z.record(z.unknown()),
  outputs: z.record(z.unknown()),
  conditions: z.object({
    pre: z.record(z.unknown()).optional(),
    post: z.record(z.unknown()).optional()
  }).optional()
});

export const MCPConfig = {
  validation: {
    timeout: 5000,
    retryAttempts: 3,
    maxPayloadSize: 1024 * 1024
  },
  security: {
    requireAuthentication: true,
    encryptPayload: true
  },
  monitoring: {
    enableMetrics: true,
    logLevel: 'info'
  }
};