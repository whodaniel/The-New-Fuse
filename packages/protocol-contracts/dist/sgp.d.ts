import { z } from 'zod';
export declare const DiscoverRequestSchema: z.ZodObject<{
    filter: z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        owner: z.ZodOptional<z.ZodString>;
    }, z.core.$catchall<z.ZodUnknown>>>;
    limit: z.ZodInt;
    cursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const DiscoverResponseItemSchema: z.ZodObject<{
    resource: z.ZodString;
    kind: z.ZodEnum<{
        workbook: "workbook";
        sheet: "sheet";
        table: "table";
        column: "column";
    }>;
    title: z.ZodString;
    updated_at: z.ZodString;
    capabilities: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const DiscoverResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        resource: z.ZodString;
        kind: z.ZodEnum<{
            workbook: "workbook";
            sheet: "sheet";
            table: "table";
            column: "column";
        }>;
        title: z.ZodString;
        updated_at: z.ZodString;
        capabilities: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    next_cursor: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export declare const ManifestPublishSchema: z.ZodObject<{
    manifest_version: z.ZodString;
    owner: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    timezone: z.ZodString;
    entry_tables: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const SchemaPublishColumnSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    nullable: z.ZodBoolean;
    unit: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const SchemaPublishSchema: z.ZodObject<{
    schema_version: z.ZodString;
    primary_key: z.ZodOptional<z.ZodArray<z.ZodString>>;
    columns: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        nullable: z.ZodBoolean;
        unit: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    compatibility: z.ZodEnum<{
        backward: "backward";
        forward: "forward";
        full: "full";
        none: "none";
    }>;
}, z.core.$strict>;
export declare const QueryWhereClauseSchema: z.ZodObject<{
    col: z.ZodString;
    op: z.ZodEnum<{
        in: "in";
        "=": "=";
        "!=": "!=";
        ">": ">";
        ">=": ">=";
        "<": "<";
        "<=": "<=";
        contains: "contains";
    }>;
    value: z.ZodUnknown;
}, z.core.$strict>;
export declare const QueryOrderByClauseSchema: z.ZodObject<{
    col: z.ZodString;
    dir: z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>;
}, z.core.$strict>;
export declare const QueryRequestSchema: z.ZodObject<{
    select: z.ZodArray<z.ZodString>;
    from: z.ZodString;
    where: z.ZodOptional<z.ZodArray<z.ZodObject<{
        col: z.ZodString;
        op: z.ZodEnum<{
            in: "in";
            "=": "=";
            "!=": "!=";
            ">": ">";
            ">=": ">=";
            "<": "<";
            "<=": "<=";
            contains: "contains";
        }>;
        value: z.ZodUnknown;
    }, z.core.$strict>>>;
    order_by: z.ZodOptional<z.ZodArray<z.ZodObject<{
        col: z.ZodString;
        dir: z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>;
    }, z.core.$strict>>>;
    limit: z.ZodOptional<z.ZodInt>;
    cursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const QueryResponseStatsSchema: z.ZodObject<{
    rows_scanned: z.ZodInt;
    rows_returned: z.ZodInt;
    latency_ms: z.ZodInt;
}, z.core.$strict>;
export declare const QueryResponseSchema: z.ZodObject<{
    schema: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
    }, z.core.$strict>>;
    rows: z.ZodArray<z.ZodArray<z.ZodUnknown>>;
    next_cursor: z.ZodNullable<z.ZodString>;
    stats: z.ZodObject<{
        rows_scanned: z.ZodInt;
        rows_returned: z.ZodInt;
        latency_ms: z.ZodInt;
    }, z.core.$strict>;
}, z.core.$strict>;
export declare const SubscribeRequestSchema: z.ZodObject<{
    resource: z.ZodString;
    from_offset: z.ZodString;
}, z.core.$strict>;
export declare const ChangeEventSchema: z.ZodObject<{
    offset: z.ZodString;
    op: z.ZodEnum<{
        update: "update";
        delete: "delete";
        insert: "insert";
        upsert: "upsert";
    }>;
    pk: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    changed_at: z.ZodString;
    source: z.ZodString;
    lineage: z.ZodOptional<z.ZodObject<{
        upstream: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const ErrorPayloadSchema: z.ZodObject<{
    code: z.ZodEnum<{
        UNAUTHORIZED: "UNAUTHORIZED";
        FORBIDDEN: "FORBIDDEN";
        NOT_FOUND: "NOT_FOUND";
        INVALID_REQUEST: "INVALID_REQUEST";
        SCHEMA_MISMATCH: "SCHEMA_MISMATCH";
        CONFLICT: "CONFLICT";
        RATE_LIMITED: "RATE_LIMITED";
        INTERNAL: "INTERNAL";
    }>;
    message: z.ZodString;
    retryable: z.ZodBoolean;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export declare const SgpPayloadSchema: z.ZodUnion<readonly [z.ZodObject<{
    filter: z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        owner: z.ZodOptional<z.ZodString>;
    }, z.core.$catchall<z.ZodUnknown>>>;
    limit: z.ZodInt;
    cursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>, z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        resource: z.ZodString;
        kind: z.ZodEnum<{
            workbook: "workbook";
            sheet: "sheet";
            table: "table";
            column: "column";
        }>;
        title: z.ZodString;
        updated_at: z.ZodString;
        capabilities: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    next_cursor: z.ZodNullable<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    manifest_version: z.ZodString;
    owner: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    timezone: z.ZodString;
    entry_tables: z.ZodArray<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    schema_version: z.ZodString;
    primary_key: z.ZodOptional<z.ZodArray<z.ZodString>>;
    columns: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        nullable: z.ZodBoolean;
        unit: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    compatibility: z.ZodEnum<{
        backward: "backward";
        forward: "forward";
        full: "full";
        none: "none";
    }>;
}, z.core.$strict>, z.ZodObject<{
    select: z.ZodArray<z.ZodString>;
    from: z.ZodString;
    where: z.ZodOptional<z.ZodArray<z.ZodObject<{
        col: z.ZodString;
        op: z.ZodEnum<{
            in: "in";
            "=": "=";
            "!=": "!=";
            ">": ">";
            ">=": ">=";
            "<": "<";
            "<=": "<=";
            contains: "contains";
        }>;
        value: z.ZodUnknown;
    }, z.core.$strict>>>;
    order_by: z.ZodOptional<z.ZodArray<z.ZodObject<{
        col: z.ZodString;
        dir: z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>;
    }, z.core.$strict>>>;
    limit: z.ZodOptional<z.ZodInt>;
    cursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>, z.ZodObject<{
    schema: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
    }, z.core.$strict>>;
    rows: z.ZodArray<z.ZodArray<z.ZodUnknown>>;
    next_cursor: z.ZodNullable<z.ZodString>;
    stats: z.ZodObject<{
        rows_scanned: z.ZodInt;
        rows_returned: z.ZodInt;
        latency_ms: z.ZodInt;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    resource: z.ZodString;
    from_offset: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    offset: z.ZodString;
    op: z.ZodEnum<{
        update: "update";
        delete: "delete";
        insert: "insert";
        upsert: "upsert";
    }>;
    pk: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    changed_at: z.ZodString;
    source: z.ZodString;
    lineage: z.ZodOptional<z.ZodObject<{
        upstream: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    code: z.ZodEnum<{
        UNAUTHORIZED: "UNAUTHORIZED";
        FORBIDDEN: "FORBIDDEN";
        NOT_FOUND: "NOT_FOUND";
        INVALID_REQUEST: "INVALID_REQUEST";
        SCHEMA_MISMATCH: "SCHEMA_MISMATCH";
        CONFLICT: "CONFLICT";
        RATE_LIMITED: "RATE_LIMITED";
        INTERNAL: "INTERNAL";
    }>;
    message: z.ZodString;
    retryable: z.ZodBoolean;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>]>;
export declare const SgpEnvelopeSchema: z.ZodUnion<readonly [z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"DISCOVER.REQUEST">;
    payload: z.ZodObject<{
        filter: z.ZodOptional<z.ZodObject<{
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            owner: z.ZodOptional<z.ZodString>;
        }, z.core.$catchall<z.ZodUnknown>>>;
        limit: z.ZodInt;
        cursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"DISCOVER.RESPONSE">;
    payload: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            resource: z.ZodString;
            kind: z.ZodEnum<{
                workbook: "workbook";
                sheet: "sheet";
                table: "table";
                column: "column";
            }>;
            title: z.ZodString;
            updated_at: z.ZodString;
            capabilities: z.ZodArray<z.ZodString>;
        }, z.core.$strict>>;
        next_cursor: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"MANIFEST.PUBLISH">;
    payload: z.ZodObject<{
        manifest_version: z.ZodString;
        owner: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        timezone: z.ZodString;
        entry_tables: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"SCHEMA.PUBLISH">;
    payload: z.ZodObject<{
        schema_version: z.ZodString;
        primary_key: z.ZodOptional<z.ZodArray<z.ZodString>>;
        columns: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            nullable: z.ZodBoolean;
            unit: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        compatibility: z.ZodEnum<{
            backward: "backward";
            forward: "forward";
            full: "full";
            none: "none";
        }>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"QUERY.REQUEST">;
    payload: z.ZodObject<{
        select: z.ZodArray<z.ZodString>;
        from: z.ZodString;
        where: z.ZodOptional<z.ZodArray<z.ZodObject<{
            col: z.ZodString;
            op: z.ZodEnum<{
                in: "in";
                "=": "=";
                "!=": "!=";
                ">": ">";
                ">=": ">=";
                "<": "<";
                "<=": "<=";
                contains: "contains";
            }>;
            value: z.ZodUnknown;
        }, z.core.$strict>>>;
        order_by: z.ZodOptional<z.ZodArray<z.ZodObject<{
            col: z.ZodString;
            dir: z.ZodEnum<{
                asc: "asc";
                desc: "desc";
            }>;
        }, z.core.$strict>>>;
        limit: z.ZodOptional<z.ZodInt>;
        cursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"QUERY.RESPONSE">;
    payload: z.ZodObject<{
        schema: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
        }, z.core.$strict>>;
        rows: z.ZodArray<z.ZodArray<z.ZodUnknown>>;
        next_cursor: z.ZodNullable<z.ZodString>;
        stats: z.ZodObject<{
            rows_scanned: z.ZodInt;
            rows_returned: z.ZodInt;
            latency_ms: z.ZodInt;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"SUBSCRIBE.REQUEST">;
    payload: z.ZodObject<{
        resource: z.ZodString;
        from_offset: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"CHANGE.EVENT">;
    payload: z.ZodObject<{
        offset: z.ZodString;
        op: z.ZodEnum<{
            update: "update";
            delete: "delete";
            insert: "insert";
            upsert: "upsert";
        }>;
        pk: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        changed_at: z.ZodString;
        source: z.ZodString;
        lineage: z.ZodOptional<z.ZodObject<{
            upstream: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodLiteral<"sgp/0.1">;
    tenant: z.ZodString;
    resource: z.ZodString;
    sent_at: z.ZodString;
    actor: z.ZodObject<{
        id: z.ZodString;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    trace: z.ZodObject<{
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    sig: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"ERROR">;
    payload: z.ZodObject<{
        code: z.ZodEnum<{
            UNAUTHORIZED: "UNAUTHORIZED";
            FORBIDDEN: "FORBIDDEN";
            NOT_FOUND: "NOT_FOUND";
            INVALID_REQUEST: "INVALID_REQUEST";
            SCHEMA_MISMATCH: "SCHEMA_MISMATCH";
            CONFLICT: "CONFLICT";
            RATE_LIMITED: "RATE_LIMITED";
            INTERNAL: "INTERNAL";
        }>;
        message: z.ZodString;
        retryable: z.ZodBoolean;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>;
}, z.core.$strict>]>;
export type SgpEnvelope = z.infer<typeof SgpEnvelopeSchema>;
export type SgpPayload = z.infer<typeof SgpPayloadSchema>;
//# sourceMappingURL=sgp.d.ts.map