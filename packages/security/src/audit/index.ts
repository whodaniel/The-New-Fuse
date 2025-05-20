import { z } from 'zod';

export const AuditLogEntry = z.object({
  id: z.string(),
  action: z.string(),
  userId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  timestamp: z.date(),
  details: z.record(z.any()).optional(),
});

export type AuditLogEntryType = z.infer<typeof AuditLogEntry>;

export class AuditService {
  constructor(private storage: any) {}
  
  async log(entry: Omit<AuditLogEntryType, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date()
    };
    
    await this.storage.createAuditLog(fullEntry);
  }
  
  async getAuditLogs(filter?: Partial<AuditLogEntryType>): Promise<AuditLogEntryType[]> {
    return this.storage.getAuditLogs(filter);
  }
}
