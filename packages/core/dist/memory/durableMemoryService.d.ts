import { z } from 'zod';
export declare const DurableMemoryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    content: z.ZodString;
    category: z.ZodEnum<{
        fact: "fact";
        preference: "preference";
        instruction: "instruction";
        context: "context";
    }>;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type DurableMemoryEntry = z.infer<typeof DurableMemoryEntrySchema>;
export declare const MEMORY_CONSTRAINTS: {
    readonly maxEntriesPerCategory: 500;
    readonly maxContentLength: 10000;
    readonly maxTotalEntries: 2000;
    readonly defaultTtlMs: number;
    readonly maxTagsPerEntry: 10;
};
export declare class DurableMemoryService {
    private entries;
    private userMd;
    private memoryMd;
    save(entry: Omit<DurableMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): DurableMemoryEntry;
    get(id: string): DurableMemoryEntry | undefined;
    getByCategory(category: DurableMemoryEntry['category']): DurableMemoryEntry[];
    search(query: string): DurableMemoryEntry[];
    delete(id: string): boolean;
    processDirective(directive: string, content: string): DurableMemoryEntry | null;
    getUserMd(): string;
    getMemoryMd(): string;
    private updateUserMd;
    private updateMemoryMd;
    private extractKey;
    private extractTags;
}
//# sourceMappingURL=durableMemoryService.d.ts.map