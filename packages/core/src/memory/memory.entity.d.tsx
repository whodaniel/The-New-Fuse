import { MemoryType } from './types.js';
export declare class MemoryEntity {
    : string;
    content: string;
    : MemoryType;
    timestamp: Date;
    metadata: Record<string, unknown>;
    embedding?: number[];
    : string[];
    : string;
    ttl?: number;
    : Date;
    searchVector: unknown;
}
