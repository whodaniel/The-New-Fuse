import { z } from 'zod';
export declare const AuditLogEntry: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    action: z.ZodString;
    timestamp: z.ZodDefault<z.ZodOptional<z.ZodDate>>;
    userId: z.ZodOptional<z.ZodString>;
    resourceId: z.ZodOptional<z.ZodString>;
    resourceType: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
}, z.core.$strip>;
export type AuditLogEntryType = z.infer<typeof AuditLogEntry>;
export interface AuditStorage {
    store(entry: AuditLogEntryType): Promise<void>;
    query(filters: Record<string, unknown>): Promise<AuditLogEntryType[]>;
}
export declare class AuditService {
    private readonly storage;
    constructor(storage: AuditStorage);
    log(entry: Omit<AuditLogEntryType, 'id' | 'timestamp'>): Promise<void>;
    query(filter: Record<string, unknown>): Promise<AuditLogEntryType[]>;
}
//# sourceMappingURL=index.d.ts.map