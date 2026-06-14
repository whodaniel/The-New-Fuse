export interface AuditStorage {
    store(entry: Record<string, unknown>): Promise<void>;
    query(filter: Record<string, unknown>): Promise<Record<string, unknown>[]>;
}
export declare class InMemoryAuditStorage implements AuditStorage {
    private entries;
    constructor();
    store(entry: Record<string, unknown>): Promise<void>;
    query(filter: Record<string, unknown>): Promise<Record<string, unknown>[]>;
}
//# sourceMappingURL=storage.d.ts.map