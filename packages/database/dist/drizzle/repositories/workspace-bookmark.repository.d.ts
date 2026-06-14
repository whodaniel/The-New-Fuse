import type { NewWorkspaceBookmark, WorkspaceBookmark } from '../types/index.js';
export declare class DrizzleWorkspaceBookmarkRepository {
    listByWorkspace(workspaceId: string): Promise<WorkspaceBookmark[]>;
    listByWorkspaceForUser(workspaceId: string, userId: string): Promise<WorkspaceBookmark[]>;
    findById(workspaceId: string, id: string): Promise<WorkspaceBookmark | null>;
    findByIdForUser(workspaceId: string, id: string, userId: string): Promise<WorkspaceBookmark | null>;
    findByUrl(workspaceId: string, url: string): Promise<WorkspaceBookmark | null>;
    findByUrlForUser(workspaceId: string, url: string, userId: string): Promise<WorkspaceBookmark | null>;
    addBookmark(data: Omit<NewWorkspaceBookmark, 'id'> & {
        id?: string;
    }): Promise<WorkspaceBookmark>;
    updateBookmark(workspaceId: string, id: string, data: Partial<Omit<NewWorkspaceBookmark, 'id' | 'workspaceId' | 'createdAt' | 'createdByUserId'>>): Promise<WorkspaceBookmark | null>;
    updateBookmarkForUser(workspaceId: string, id: string, userId: string, data: Partial<Omit<NewWorkspaceBookmark, 'id' | 'workspaceId' | 'createdAt' | 'createdByUserId'>>): Promise<WorkspaceBookmark | null>;
    removeBookmark(workspaceId: string, id: string): Promise<boolean>;
    removeBookmarkForUser(workspaceId: string, id: string, userId: string): Promise<boolean>;
}
export declare const drizzleWorkspaceBookmarkRepository: DrizzleWorkspaceBookmarkRepository;
//# sourceMappingURL=workspace-bookmark.repository.d.ts.map