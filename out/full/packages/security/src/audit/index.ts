import { Injectable } from '@nestjs/common';
import { z } from 'zod';

export const AuditLogEntry = z.object({
    id: z.string().optional(),
    action: z.string(),
    timestamp: z.date().optional().default(() => new Date()),
    userId: z.string().optional(),
    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
    details: z.record(z.any()).optional()
});

export type AuditLogEntryType = z.infer<typeof AuditLogEntry>;

export interface AuditStorage {
  store(entry: AuditLogEntryType): Promise<void>;
  query(filters: Record<string, unknown>): Promise<AuditLogEntryType[]>;
}

@Injectable()
export class AuditService {
    constructor(private readonly storage: AuditStorage) {}

    async log(entry: Omit<AuditLogEntryType, 'id' | 'timestamp'>): Promise<void> {
        const fullEntry = AuditLogEntry.parse({
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date()
        });
        await this.storage.store(fullEntry);
    }

    async query(filter: Record<string, unknown>): Promise<AuditLogEntryType[]> {
        return this.storage.query(filter);
    }
}
