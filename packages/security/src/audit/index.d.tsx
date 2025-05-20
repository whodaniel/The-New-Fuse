import type { z } from 'zod';
import type { AuditStorage } from './storage.js';

export declare const AuditLogEntry: z.ZodType<any>;
export type AuditLogEntryType = z.infer<typeof AuditLogEntry>;

export declare class AuditService {
    private readonly storage: AuditStorage;
    constructor(storage: AuditStorage);
    log(entry: AuditLogEntryType): Promise<void>;
    query(filter: Record<string, unknown>): Promise<AuditLogEntryType[]>;
}
