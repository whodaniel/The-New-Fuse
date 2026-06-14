import { workspaces } from '../schema.js';
import type { NewWorkspaceMember, WorkspaceMember } from '../types/index.js';
export declare class DrizzleWorkspaceMemberRepository {
    addMember(data: Omit<NewWorkspaceMember, 'id'> & {
        id?: string;
    }): Promise<WorkspaceMember>;
    upsertMember(data: Omit<NewWorkspaceMember, 'id'> & {
        id?: string;
    }): Promise<WorkspaceMember>;
    findMembership(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
    listByWorkspace(workspaceId: string): Promise<WorkspaceMember[]>;
    listByWorkspaceWithUsers(workspaceId: string): Promise<Array<WorkspaceMember & {
        userEmail: string | null;
    }>>;
    listByUser(userId: string): Promise<WorkspaceMember[]>;
    removeMember(workspaceId: string, userId: string): Promise<boolean>;
    updateRole(workspaceId: string, userId: string, role: WorkspaceMember['role']): Promise<WorkspaceMember | null>;
    listWorkspaceIdsForUser(userId: string): Promise<string[]>;
    listWorkspacesForUser(userId: string): Promise<Array<{
        workspaceId: string;
    }>>;
    listWorkspacesForUsers(userIds: string[]): Promise<Array<{
        workspaceId: string;
        userId: string;
    }>>;
    listWorkspacesWithOwnerForUser(userId: string): Promise<Array<{
        workspace: typeof workspaces.$inferSelect;
        ownerEmail: string | null;
    }>>;
}
export declare const drizzleWorkspaceMemberRepository: DrizzleWorkspaceMemberRepository;
//# sourceMappingURL=workspace-member.repository.d.ts.map