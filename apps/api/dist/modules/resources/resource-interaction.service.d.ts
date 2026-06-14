import { DatabaseService } from '@the-new-fuse/database/drizzle';
export type ResourceShareRecord = {
    id: string | null;
    resourceId: string;
    fromUserId: string;
    toAgentId: string;
    notes: string | null;
    sharedAt: string;
};
export declare class ResourceInteractionService {
    private readonly db;
    constructor(db: DatabaseService);
    toggleFavorite(resourceId: string, userId: string): Promise<{
        favorite: boolean;
    }>;
    shareResource(input: {
        resourceId: string;
        fromUserId: string;
        toAgentId: string;
        notes?: string | null;
    }): Promise<ResourceShareRecord>;
}
//# sourceMappingURL=resource-interaction.service.d.ts.map