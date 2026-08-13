import { z } from 'zod';

export const AdkMessageSchema = z
  .object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })
  .strict();

export const ExecuteInputSchema = z
  .object({
    messages: z.array(AdkMessageSchema).optional().default([]),
  })
  .strict();

export const ExecuteMetadataSchema = z
  .object({
    source: z.string().optional(),
    policyProfile: z.string().optional(),
    provider: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

export const ExecuteRequestSchema = z
  .object({
    requestId: z.string().min(1),
    traceId: z.string().min(1),
    workspaceId: z.string().min(1),
    agentId: z.string().min(1),
    model: z.string().min(1).optional().default('gemini-2.5-pro'),
    input: ExecuteInputSchema,
    tools: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    metadata: ExecuteMetadataSchema.optional().default({ provider: {} }),
    timeoutMs: z.int().min(1).optional().default(120000),
  })
  .strict();

export const UsageSchema = z
  .object({
    inputTokens: z.int().min(0),
    outputTokens: z.int().min(0),
    totalTokens: z.int().min(0),
  })
  .strict();

export const ExecuteOutputSchema = z
  .object({
    content: z.string(),
    parts: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .strict();

export const ExecuteResponseSchema = z
  .object({
    requestId: z.string().min(1),
    traceId: z.string().min(1),
    status: z.enum(['ok', 'error']),
    output: ExecuteOutputSchema,
    usage: UsageSchema,
    toolCalls: z.array(z.record(z.string(), z.unknown())).default([]),
    latencyMs: z.int().min(0),
    provider: z.string().min(1),
    model: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

export type AdkMessage = z.infer<typeof AdkMessageSchema>;
export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;
export type ExecuteResponse = z.infer<typeof ExecuteResponseSchema>;
