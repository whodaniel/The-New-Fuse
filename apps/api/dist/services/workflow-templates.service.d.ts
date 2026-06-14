import { DatabaseService } from '@the-new-fuse/database';
export declare class WorkflowTemplatesService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    findAll(userId?: string): Promise<any[]>;
    findOne(id: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: unknown;
        category: string;
        isPublic: boolean;
        usageCount: number;
        definition: unknown;
        creatorId: string | null;
    }>;
    create(data: any, userId: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: unknown;
        category: string;
        isPublic: boolean;
        usageCount: number;
        definition: unknown;
        creatorId: string | null;
    }>;
    update(id: string, data: any, userId: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: unknown;
        category: string;
        isPublic: boolean;
        usageCount: number;
        definition: unknown;
        creatorId: string | null;
    } | null>;
    remove(id: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=workflow-templates.service.d.ts.map