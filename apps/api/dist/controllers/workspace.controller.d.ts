import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';
type WorkspaceAccessRole = 'owner' | 'admin' | 'member' | 'viewer';
type WorkspaceManageableRole = Exclude<WorkspaceAccessRole, 'owner'>;
/**
 * DTO for creating a new workspace
 */
export declare class CreateWorkspaceDto {
    name: string;
    description?: string;
}
/**
 * DTO for updating a workspace
 */
export declare class UpdateWorkspaceDto {
    name?: string;
    description?: string;
}
/**
 * DTO for adding a workspace member
 */
export declare class AddWorkspaceMemberDto {
    userId?: string;
    email?: string;
    role?: WorkspaceManageableRole;
}
/**
 * DTO for updating a workspace member role
 */
export declare class UpdateWorkspaceMemberRoleDto {
    role: WorkspaceManageableRole;
}
/**
 * DTO for setting delegated sub-access (VA access)
 */
export declare class SetWorkspaceSubAccessDto extends AddWorkspaceMemberDto {
}
/**
 * DTO for updating delegated sub-access (VA access)
 */
export declare class UpdateWorkspaceSubAccessDto extends UpdateWorkspaceMemberRoleDto {
}
/**
 * DTO for workspace custom domain
 */
export declare class CreateWorkspaceDomainDto {
    domain: string;
}
/**
 * DTO for workspace bookmark
 */
export declare class CreateWorkspaceBookmarkDto {
    title: string;
    url: string;
    tags?: string[];
    note?: string;
}
/**
 * DTO for updating workspace bookmark
 */
export declare class UpdateWorkspaceBookmarkDto {
    title?: string;
    url?: string;
    tags?: string[];
    note?: string;
}
interface WorkspaceWithOwner {
    id: string;
    ownerId: string;
    createdAt: Date;
    owner: {
        email: string | null;
    } | null;
}
interface WorkspaceMemberView {
    userId: string;
    email: string | null;
    role: WorkspaceAccessRole;
    joinedAt: Date;
}
interface WorkspaceAssetSummaryProject {
    projectName: string;
    timelineTrackKeys: string[];
    timelineEventCount: number;
    linkedAssetCount: number;
    latestEvidenceAt: string | null;
}
interface WorkspaceAssetSummaryAsset {
    ref: string;
    occurrences: number;
    projects: string[];
    lastSeenAt: string | null;
}
interface WorkspaceAssetSummaryEvent {
    id: string;
    title: string;
    timestamp: string;
    projectName: string;
    linkedAssetCount: number;
}
interface WorkspaceAssetSummaryResponse {
    workspaceId: string;
    ownerId: string;
    scope: 'owner' | 'delegated';
    totalTimelineEvents: number;
    uniqueLinkedAssets: number;
    assetPagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    eventPagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    appliedFilters: {
        project: string | null;
        timelineTrack: string | null;
        assetSearch: string | null;
    };
    projects: WorkspaceAssetSummaryProject[];
    assets: WorkspaceAssetSummaryAsset[];
    recentEvents: WorkspaceAssetSummaryEvent[];
}
export declare class WorkspaceController implements OnModuleInit, OnModuleDestroy {
    private readonly db;
    private readonly unifiedLedger?;
    private readonly logger;
    private readonly hostMariaOwnerEmails;
    private hostMariaAutoSyncTimer;
    private hostMariaAutoSyncRunning;
    constructor(db: DatabaseService, unifiedLedger?: UnifiedLedgerService | undefined);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private isHostMariaAutoSyncEnabled;
    private shouldRunHostMariaAutoSyncOnStart;
    private getHostMariaAutoSyncIntervalMs;
    private runHostMariaAutoSyncCycle;
    private requireActor;
    private isHostMariaOwnerEmail;
    private isHostMariaProject;
    private canAccessHostMariaWorkspace;
    private ensureHostMariaWorkspaceAccess;
    private resolveHostMariaPaths;
    private sanitizeSyncKey;
    private normalizeHostMariaTarget;
    private normalizeHostMariaSeverity;
    private asObject;
    private asStringArray;
    private readJsonObject;
    private readHostMariaSyncInputs;
    private mapSeverityToTaskStatus;
    private mapSeverityToTaskPriority;
    private mapTaskStatusToLedgerStatus;
    private mapTaskPriorityToLedgerPriority;
    private formatTargetStatusSummary;
    private buildHostMariaTaskBlueprints;
    private upsertHostMariaProject;
    private upsertHostMariaTasks;
    private upsertHostMariaTasksModern;
    private normalizeSqlRows;
    private isHostMariaLegacyTaskSchemaError;
    private upsertHostMariaTasksLegacy;
    private upsertHostMariaLedgerTasks;
    private normalizeDomain;
    private normalizeBookmarkUrl;
    private isValidDomain;
    private isValidBookmarkUrl;
    private verifyDomainDns;
    private handleError;
    private validateUser;
    private timelineTrackToProjectName;
    private readTimelineProject;
    private readTimelineAssetRefs;
    private readTimelineEventTitle;
    private parsePositiveInt;
    private normalizeRole;
    private listAccessibleWorkspaces;
    private ensureWorkspaceAccess;
    private ensureWorkspaceMemberManagement;
    private ensureWorkspaceWriteAccess;
    private resolveTargetUserId;
    private listWorkspaceMembersInternal;
    private addWorkspaceMemberInternal;
    private updateWorkspaceMemberRoleInternal;
    private removeWorkspaceMemberInternal;
    /**
     * Get all workspaces accessible by the current user
     */
    getAllWorkspaces(userId: string): Promise<any[]>;
    /**
     * Get current workspace for user.
     * Uses first accessible workspace as default current workspace.
     */
    getCurrentWorkspace(userId: string): Promise<any>;
    /**
     * Get workspace by ID
     * Accessible by workspace owner or members
     */
    getWorkspaceById(id: string, userId: string): Promise<WorkspaceWithOwner>;
    /**
     * Create a new workspace
     * The current user becomes the owner
     */
    createWorkspace(workspaceData: CreateWorkspaceDto, userId: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    /**
     * Update workspace
     * Accessible by workspace owner and admins
     */
    updateWorkspace(id: string, workspaceData: UpdateWorkspaceDto, userId: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    } | null>;
    /**
     * Delete workspace
     * Only the owner can delete the workspace
     */
    deleteWorkspace(id: string, userId: string): Promise<{
        message: string;
        id: string;
    }>;
    /**
     * Get workspace members
     */
    getWorkspaceMembers(id: string, userId: string): Promise<WorkspaceMemberView[]>;
    /**
     * Add member to workspace by userId or email
     */
    addWorkspaceMember(id: string, memberData: AddWorkspaceMemberDto, userId: string): Promise<{
        message: string;
        member: {
            userId: string;
            email: string | null;
            role: "admin" | "owner" | "member" | "viewer";
            joinedAt: Date;
        };
    }>;
    /**
     * Update member role in workspace
     */
    updateWorkspaceMemberRole(id: string, memberUserId: string, roleData: UpdateWorkspaceMemberRoleDto, userId: string): Promise<{
        message: string;
        member: {
            userId: string;
            email: string | null;
            role: "admin" | "owner" | "member" | "viewer";
            joinedAt: Date;
        };
    }>;
    /**
     * Remove member from workspace
     */
    removeWorkspaceMember(id: string, memberUserId: string, userId: string): Promise<{
        message: string;
        memberId: string;
    }>;
    /**
     * List delegated sub-access users (non-owner members), useful for VA management UIs.
     */
    listWorkspaceSubAccess(id: string, userId: string): Promise<{
        workspaceId: string;
        members: {
            accessLevel: WorkspaceAccessRole;
            userId: string;
            email: string | null;
            role: WorkspaceAccessRole;
            joinedAt: Date;
        }[];
    }>;
    /**
     * Grant delegated sub-access (VA access) using email or userId.
     */
    grantWorkspaceSubAccess(id: string, accessData: SetWorkspaceSubAccessDto, userId: string): Promise<{
        message: string;
        member: {
            userId: string;
            email: string | null;
            role: "admin" | "owner" | "member" | "viewer";
            joinedAt: Date;
        };
        accessLevel: "admin" | "owner" | "member" | "viewer";
    }>;
    /**
     * Update delegated sub-access role.
     */
    updateWorkspaceSubAccess(id: string, memberUserId: string, accessData: UpdateWorkspaceSubAccessDto, userId: string): Promise<{
        message: string;
        member: {
            userId: string;
            email: string | null;
            role: "admin" | "owner" | "member" | "viewer";
            joinedAt: Date;
        };
        accessLevel: "admin" | "owner" | "member" | "viewer";
    }>;
    /**
     * Revoke delegated sub-access.
     */
    revokeWorkspaceSubAccess(id: string, memberUserId: string, userId: string): Promise<{
        message: string;
        memberId: string;
    }>;
    /**
     * List custom domains assigned to workspace.
     */
    getWorkspaceDomains(id: string, userId: string): Promise<{
        workspaceId: string;
        items: any;
    }>;
    /**
     * Add custom domain for workspace.
     */
    addWorkspaceDomain(id: string, payload: CreateWorkspaceDomainDto, userId: string): Promise<{
        workspaceId: string;
        item: any;
    }>;
    /**
     * Remove custom domain from workspace.
     */
    removeWorkspaceDomain(id: string, domainId: string, userId: string): Promise<{
        workspaceId: string;
        domainId: string;
    }>;
    /**
     * Verify custom domain DNS state for workspace.
     */
    verifyWorkspaceDomain(id: string, domainId: string, userId: string): Promise<{
        workspaceId: string;
        item: any;
    }>;
    /**
     * List workspace bookmarks.
     */
    getWorkspaceBookmarks(id: string, userId: string): Promise<{
        workspaceId: string;
        items: any;
    }>;
    /**
     * Add (or upsert by URL) workspace bookmark.
     */
    addWorkspaceBookmark(id: string, payload: CreateWorkspaceBookmarkDto, userId: string): Promise<{
        workspaceId: string;
        item: any;
    }>;
    /**
     * Update workspace bookmark.
     */
    updateWorkspaceBookmark(id: string, bookmarkId: string, payload: UpdateWorkspaceBookmarkDto, userId: string): Promise<{
        workspaceId: string;
        item: any;
    }>;
    /**
     * Remove workspace bookmark.
     */
    removeWorkspaceBookmark(id: string, bookmarkId: string, userId: string): Promise<{
        workspaceId: string;
        bookmarkId: string;
    }>;
    /**
     * Get workspace asset exposure summary (owner-scoped timeline + linked assets).
     */
    getWorkspaceAssets(id: string, userId: string, projectQuery?: string, timelineTrackQuery?: string, assetSearchQuery?: string, assetPageQuery?: string, assetPageSizeQuery?: string, eventPageQuery?: string, eventPageSizeQuery?: string, projectLimitQuery?: string): Promise<WorkspaceAssetSummaryResponse>;
    /**
     * Get all projects in a workspace
     */
    getWorkspaceProjects(id: string, userId: string): Promise<any[]>;
}
export {};
//# sourceMappingURL=workspace.controller.d.ts.map