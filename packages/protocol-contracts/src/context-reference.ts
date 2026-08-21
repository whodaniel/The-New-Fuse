import { z } from 'zod';

export const ContextReferenceSchema = z
  .object({
    version: z.literal('dacc-context-ref/1.0'),
    uri: z.string().regex(/^redis:\/\/tnf:context:[A-Za-z0-9._-]+$/),
    digest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    byteCount: z.int().min(0),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    snapshotVersion: z.int().min(1),
    authorityScope: z.string().min(1),
    producerAgentId: z.string().min(1).optional(),
    contentType: z.string().min(1).default('text/plain; charset=utf-8'),
  })
  .strict();

export const ContextEfficiencyReceiptSchema = z
  .object({
    version: z.literal('cer/1.0'),
    contextUri: z.string().regex(/^redis:\/\/tnf:context:[A-Za-z0-9._-]+$/),
    originalBytes: z.int().min(0),
    inlineBytes: z.int().min(0),
    hydratedBytes: z.int().min(0),
    savedTransportBytes: z.int(),
    cer: z.number().min(-1).max(1),
    outcome: z.enum([
      'referenced',
      'hydrated',
      'forwarded-passive',
      'missing',
      'expired',
      'digest-mismatch',
      'snapshot-drift',
      'merge-collision',
      'timeout',
    ]),
    measuredAt: z.string().datetime(),
  })
  .strict();

export const ContextReferenceRecordSchema = z
  .object({
    reference: ContextReferenceSchema,
    content: z.string(),
  })
  .strict();

export type ContextReference = z.infer<typeof ContextReferenceSchema>;
export type ContextEfficiencyReceipt = z.infer<typeof ContextEfficiencyReceiptSchema>;
export type ContextReferenceRecord = z.infer<typeof ContextReferenceRecordSchema>;
