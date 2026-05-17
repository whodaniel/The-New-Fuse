import { z } from 'zod';

const UUID = z.string().uuid();
const DATE_TIME = z.string().datetime({ offset: true });
const SGP_RESOURCE_PATTERN = /^sgp:\/\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/;

const SgpResourceSchema = z.string().regex(SGP_RESOURCE_PATTERN);

export const DiscoverRequestSchema = z
  .object({
    filter: z
      .object({
        tags: z.array(z.string()).optional(),
        owner: z.string().optional(),
      })
      .catchall(z.unknown())
      .optional(),
    limit: z.int().min(1).max(500),
    cursor: z.string().nullable().optional(),
  })
  .strict();

export const DiscoverResponseItemSchema = z
  .object({
    resource: SgpResourceSchema,
    kind: z.enum(['workbook', 'sheet', 'table', 'column']),
    title: z.string(),
    updated_at: DATE_TIME,
    capabilities: z.array(z.string()),
  })
  .strict();

export const DiscoverResponseSchema = z
  .object({
    items: z.array(DiscoverResponseItemSchema),
    next_cursor: z.string().nullable(),
  })
  .strict();

export const ManifestPublishSchema = z
  .object({
    manifest_version: z.string(),
    owner: z.string(),
    tags: z.array(z.string()).optional(),
    timezone: z.string(),
    entry_tables: z.array(SgpResourceSchema).min(1),
  })
  .strict();

export const SchemaPublishColumnSchema = z
  .object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean(),
    unit: z.string().optional(),
  })
  .strict();

export const SchemaPublishSchema = z
  .object({
    schema_version: z.string(),
    primary_key: z.array(z.string()).optional(),
    columns: z.array(SchemaPublishColumnSchema).min(1),
    compatibility: z.enum(['backward', 'forward', 'full', 'none']),
  })
  .strict();

export const QueryWhereClauseSchema = z
  .object({
    col: z.string(),
    op: z.enum(['=', '!=', '>', '>=', '<', '<=', 'in', 'contains']),
    value: z.unknown(),
  })
  .strict();

export const QueryOrderByClauseSchema = z
  .object({
    col: z.string(),
    dir: z.enum(['asc', 'desc']),
  })
  .strict();

export const QueryRequestSchema = z
  .object({
    select: z.array(z.string()).min(1),
    from: SgpResourceSchema,
    where: z.array(QueryWhereClauseSchema).optional(),
    order_by: z.array(QueryOrderByClauseSchema).optional(),
    limit: z.int().min(1).max(50000).optional(),
    cursor: z.string().nullable().optional(),
  })
  .strict();

export const QueryResponseStatsSchema = z
  .object({
    rows_scanned: z.int().min(0),
    rows_returned: z.int().min(0),
    latency_ms: z.int().min(0),
  })
  .strict();

export const QueryResponseSchema = z
  .object({
    schema: z
      .array(
        z
          .object({
            name: z.string(),
            type: z.string(),
          })
          .strict(),
      ),
    rows: z.array(z.array(z.unknown())),
    next_cursor: z.string().nullable(),
    stats: QueryResponseStatsSchema,
  })
  .strict();

export const SubscribeRequestSchema = z
  .object({
    resource: SgpResourceSchema,
    from_offset: z.string(),
  })
  .strict();

export const ChangeEventSchema = z
  .object({
    offset: z.string(),
    op: z.enum(['insert', 'update', 'delete', 'upsert']),
    pk: z.record(z.string(), z.unknown()),
    before: z.record(z.string(), z.unknown()).optional(),
    after: z.record(z.string(), z.unknown()).optional(),
    changed_at: DATE_TIME,
    source: z.string(),
    lineage: z
      .object({
        upstream: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const ErrorPayloadSchema = z
  .object({
    code: z.enum([
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'INVALID_REQUEST',
      'SCHEMA_MISMATCH',
      'CONFLICT',
      'RATE_LIMITED',
      'INTERNAL',
    ]),
    message: z.string(),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const SgpPayloadSchema = z.union([
  DiscoverRequestSchema,
  DiscoverResponseSchema,
  ManifestPublishSchema,
  SchemaPublishSchema,
  QueryRequestSchema,
  QueryResponseSchema,
  SubscribeRequestSchema,
  ChangeEventSchema,
  ErrorPayloadSchema,
]);

const SgpEnvelopeBaseSchema = z
  .object({
    id: UUID,
    spec: z.literal('sgp/0.1'),
    tenant: z.string().min(1),
    resource: SgpResourceSchema,
    sent_at: DATE_TIME,
    actor: z
      .object({
        id: z.string().min(1),
        roles: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    trace: z
      .object({
        correlation_id: UUID,
        causation_id: z.string().nullable(),
      })
      .strict(),
    sig: z.string().optional(),
  })
  .strict();

export const SgpEnvelopeSchema = z.union([
  SgpEnvelopeBaseSchema.extend({ type: z.literal('DISCOVER.REQUEST'), payload: DiscoverRequestSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('DISCOVER.RESPONSE'), payload: DiscoverResponseSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('MANIFEST.PUBLISH'), payload: ManifestPublishSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('SCHEMA.PUBLISH'), payload: SchemaPublishSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('QUERY.REQUEST'), payload: QueryRequestSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('QUERY.RESPONSE'), payload: QueryResponseSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('SUBSCRIBE.REQUEST'), payload: SubscribeRequestSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('CHANGE.EVENT'), payload: ChangeEventSchema }).strict(),
  SgpEnvelopeBaseSchema.extend({ type: z.literal('ERROR'), payload: ErrorPayloadSchema }).strict(),
]);

export type SgpEnvelope = z.infer<typeof SgpEnvelopeSchema>;
export type SgpPayload = z.infer<typeof SgpPayloadSchema>;
