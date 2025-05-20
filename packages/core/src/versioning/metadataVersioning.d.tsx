import { Database } from 'sqlite3';
export declare enum ChangeType {
    PERSONALITY = "personality",
    CAPABILITY = "capability",
    EXPERTISE = "expertise",
    COMMUNICATION = "communication",
    RELATIONSHIP = "relationship",
    CHARACTER_ARC = "character_arc"
}
export interface MetadataChange {
    changeId: string;
    agentId: string;
    timestamp: string;
    changeType: ChangeType;
    previousValue: unknown;
    newValue: unknown;
    reason: string;
    triggerEvent?: string;
    storyContext?: Record<string, unknown>;
    relatedAgents?: string[];
}
export declare class MetadataVersioning {
    private dbManager;
    constructor(dbManager: Database);
    initVersioningTables(): Promise<void>;
}
