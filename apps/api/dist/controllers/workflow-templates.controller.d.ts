import { WorkflowTemplatesService } from '../services/workflow-templates.service';
export declare class WorkflowTemplatesController {
    private readonly templatesService;
    constructor(templatesService: WorkflowTemplatesService);
    findAll(user: any): Promise<any[]>;
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
    create(createDto: any, user: any): Promise<{
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
    update(id: string, updateDto: any, user: any): Promise<{
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
    remove(id: string, user: any): Promise<boolean>;
}
//# sourceMappingURL=workflow-templates.controller.d.ts.map