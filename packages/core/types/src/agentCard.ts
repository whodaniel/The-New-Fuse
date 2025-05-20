import { z } from 'zod';
import { AgentCapability, AgentRole, AgentType } from './agent.js';

export const agentCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  capabilities: z.array(z.nativeEnum(AgentCapability)),
  role: z.nativeEnum(AgentRole),
  type: z.nativeEnum(AgentType),
  endpoints: z.object({
    discovery: z.string().url(),
    messaging: z.string().url(),
    metrics: z.string().url().optional(),
  }),
  protocols: z.array(z.string()),
  security: z.object({
    authentication: z.enum(['none', 'api_key', 'oauth2', 'jwt']),
    encryption: z.boolean(),
    rateLimit: z.number().optional(),
  }),
  metadata: z.record(z.unknown()).optional(),
});

export type AgentCard = z.infer<typeof agentCardSchema>;