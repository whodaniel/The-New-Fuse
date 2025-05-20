import { Logger } from '@the-new-fuse/utils';

export interface AuditStorage {
  store(entry: Record<string, unknown>): Promise<void>;
  query(filter: Record<string, unknown>): Promise<Record<string, unknown>[]>;
}

// In-memory implementation for development/testing
export class InMemoryAuditStorage implements AuditStorage {
  private entries: Record<string, unknown>[] = [];
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger('InMemoryAuditStorage');
  }

  async store(entry: Record<string, unknown>): Promise<void> {
    this.entries.push(entry);
    this.logger.debug('Stored audit entry', { entry });
  }

  async query(filter: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    return this.entries.filter(entry => {
      return Object.entries(filter).every(([key, value]) => entry[key] === value);
    });
  }
}