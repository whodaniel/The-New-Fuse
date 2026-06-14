import { z } from 'zod';
export const ExecuteQueryToolSchema = z.object({
    query: z.string(),
    params: z.array(z.unknown()).default([]),
    readOnly: z.boolean().default(true),
    timeoutMs: z.number().int().min(100).max(60000).default(10000),
});
const DANGEROUS_PATTERNS = [
    /\bDROP\s+/i,
    /\bTRUNCATE\s+/i,
    /\bDELETE\s+FROM\s+(?!.*WHERE)/i,
    /\bALTER\s+/i,
    /\bCREATE\s+USER/i,
    /\bGRANT\s+/i,
    /\bREVOKE\s+/i,
];
export class ExecuteQueryTool {
    constructor(client, allowWrites = false) {
        this.client = client;
        this.allowWrites = allowWrites;
    }
    async execute(params) {
        if (params.readOnly && this.isWriteQuery(params.query)) {
            return {
                rows: [],
                rowCount: 0,
                durationMs: 0,
                error: 'Write operations not allowed in read-only mode',
            };
        }
        if (!this.allowWrites && this.isWriteQuery(params.query)) {
            return {
                rows: [],
                rowCount: 0,
                durationMs: 0,
                error: 'Write operations not permitted by tool configuration',
            };
        }
        for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(params.query)) {
                return {
                    rows: [],
                    rowCount: 0,
                    durationMs: 0,
                    error: `Dangerous SQL pattern detected: ${pattern.source}`,
                };
            }
        }
        const start = Date.now();
        try {
            const result = await this.client.query(params.query, params.params);
            return {
                rows: result.rows,
                rowCount: result.rowCount,
                durationMs: Date.now() - start,
            };
        }
        catch (err) {
            return {
                rows: [],
                rowCount: 0,
                durationMs: Date.now() - start,
                error: err.message ?? String(err),
            };
        }
    }
    isWriteQuery(sql) {
        const trimmed = sql.trim().toUpperCase();
        return /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s/.test(trimmed);
    }
}
//# sourceMappingURL=executeQueryTool.js.map