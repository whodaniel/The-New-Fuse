import { DashboardState } from '../collaboration/types.js';
import { DatabaseService } from '@the-new-fuse/database';
export interface Template {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    category: string;
    tags: string[];
    state: DashboardState;
    creator: {
        id: string;
        name: string;
    };
    createdAt: Date;
    updatedAt?: Date;
    usageCount: number;
    isPublic: boolean;
    variables: Array<{
        name: string;
        type: string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
        description: string;
        defaultValue?: unknown;
        required: boolean;
    }>;
    version: string;
    lastUsedAt?: Date;
}
export declare class TemplateManager {
    private templates;
    private storage;
    private storageKey;
    private databaseService;
    private logger;
    private readonly maxTemplateAge;
    constructor(storage: Storage | undefined, storageKey: string | undefined, databaseService: DatabaseService);
    private cleanupOldTemplates;
}
