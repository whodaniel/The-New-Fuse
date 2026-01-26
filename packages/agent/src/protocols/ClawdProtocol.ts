import { z } from 'zod';

// --- Primitives ---

export const GatewayClientIdSchema = z.string().min(1);
export const GatewayClientModeSchema = z.enum(['headless', 'desktop', 'web', 'mobile']);
export const NonEmptyString = z.string().min(1);
export const SnapshotSchema = z.record(z.string(), z.unknown()); // Placeholder
export const StateVersionSchema = z.string(); // Placeholder

// --- Events ---

export const TickEventSchema = z.object({
  ts: z.number().int().min(0),
});

export const ShutdownEventSchema = z.object({
  reason: NonEmptyString,
  restartExpectedMs: z.number().int().min(0).optional(),
});

// --- Handshake ---

export const ConnectParamsSchema = z.object({
  minProtocol: z.number().int().min(1),
  maxProtocol: z.number().int().min(1),
  client: z.object({
    id: GatewayClientIdSchema,
    displayName: NonEmptyString.optional(),
    version: NonEmptyString,
    platform: NonEmptyString,
    deviceFamily: NonEmptyString.optional(),
    modelIdentifier: NonEmptyString.optional(),
    mode: GatewayClientModeSchema,
    instanceId: NonEmptyString.optional(),
  }),
  caps: z.array(NonEmptyString).default([]).optional(),
  commands: z.array(NonEmptyString).optional(),
  permissions: z.record(NonEmptyString, z.boolean()).optional(),
  pathEnv: z.string().optional(),
  role: NonEmptyString.optional(),
  scopes: z.array(NonEmptyString).optional(),
  // ... device and auth omitted for brevity in initial assimilation
  locale: z.string().optional(),
  userAgent: z.string().optional(),
});

export const HelloOkSchema = z.object({
  type: z.literal('hello-ok'),
  protocol: z.number().int().min(1),
  server: z.object({
    version: NonEmptyString,
    commit: NonEmptyString.optional(),
    host: NonEmptyString.optional(),
    connId: NonEmptyString,
  }),
  features: z.object({
    methods: z.array(NonEmptyString),
    events: z.array(NonEmptyString),
  }),
  snapshot: SnapshotSchema,
  canvasHostUrl: NonEmptyString.optional(),
  auth: z
    .object({
      deviceToken: NonEmptyString,
      role: NonEmptyString,
      scopes: z.array(NonEmptyString),
      issuedAtMs: z.number().int().min(0).optional(),
    })
    .optional(),
  policy: z.object({
    maxPayload: z.number().int().min(1),
    maxBufferedBytes: z.number().int().min(1),
    tickIntervalMs: z.number().int().min(1),
  }),
});

export const ErrorShapeSchema = z.object({
  code: NonEmptyString,
  message: NonEmptyString,
  details: z.unknown().optional(),
  retryable: z.boolean().optional(),
  retryAfterMs: z.number().int().min(0).optional(),
});

// --- Frames ---

export const RequestFrameSchema = z.object({
  type: z.literal('req'),
  id: NonEmptyString,
  method: NonEmptyString,
  params: z.unknown().optional(),
});

export const ResponseFrameSchema = z.object({
  type: z.literal('res'),
  id: NonEmptyString,
  ok: z.boolean(),
  payload: z.unknown().optional(),
  error: ErrorShapeSchema.optional(),
});

export const EventFrameSchema = z.object({
  type: z.literal('event'),
  event: NonEmptyString,
  payload: z.unknown().optional(),
  seq: z.number().int().min(0).optional(),
  stateVersion: StateVersionSchema.optional(),
});

export type IConnectParams = z.infer<typeof ConnectParamsSchema>;
export type IHelloOk = z.infer<typeof HelloOkSchema>;
export type IRequestFrame = z.infer<typeof RequestFrameSchema>;
export type IResponseFrame = z.infer<typeof ResponseFrameSchema>;
export type IEventFrame = z.infer<typeof EventFrameSchema>;
