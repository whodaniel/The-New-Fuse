import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { workspaces } from '../schema.js';
export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;
/**
 * Workspace Repository - provides data access for Workspace entities
 */
export declare class DrizzleWorkspaceRepository {
    /**
     * Create a new workspace
     */
    create(data: Omit<NewWorkspace, 'id'> & {
        id?: string;
    }): Promise<Workspace>;
    /**
     * Find workspace by ID
     */
    findById(id: string): Promise<Workspace | null>;
    /**
     * Find workspace by name (slug)
     */
    findByName(name: string): Promise<Workspace | null>;
    /**
     * Find all workspaces for an owner
     */
    findByOwner(ownerId: string): Promise<Workspace[]>;
    /**
     * Find first workspace by user ID (alias for ownerId)
     */
    findByUserId(userId: string): Promise<Workspace | null>;
    /**
     * Update workspace
     */
    update(id: string, data: Partial<NewWorkspace>): Promise<Workspace | null>;
    /**
     * Delete workspace
     */
    delete(id: string): Promise<boolean>;
    /**
     * Find all workspaces
     */
    findAll(): Promise<Workspace[]>;
    /**
     * Find workspaces by IDs
     */
    findByIds(ids: string[]): Promise<Workspace[]>;
    /**
     * Find workspace with related projects
     * Note: This mimics Drizzle's `include: { projects: true }`
     */
    findByIdWithProjects(id: string): Promise<(Workspace & {
        projects: any[];
    }) | null>;
    /**
     * Find workspace by name with related projects
     */
    findByNameWithProjects(name: string): Promise<(Workspace & {
        projects: any[];
    }) | null>;
    /**
     * Find workspace by ID with owner
     */
    findByIdWithOwner(id: string): Promise<(Workspace & {
        owner: {
            email: string | null;
        } | null;
        projects: any[];
    }) | null>;
    /**
     * Find workspace by name with owner
     */
    findByNameWithOwner(name: string): Promise<(Workspace & {
        owner: {
            email: string | null;
        } | null;
        projects: any[];
    }) | null>;
    /**
     * Find all workspaces for owner with owner details
     */
    findByOwnerWithOwner(ownerId: string): Promise<(Workspace & {
        owner: {
            email: string | null;
        } | null;
    })[]>;
    /**
     * Find all workspaces with owner details
     */
    findAllWithOwner(): Promise<(Workspace & {
        owner: {
            email: string | null;
        } | null;
    })[]>;
    /**
     * Find workspaces by IDs with owner details
     */
    findByIdsWithOwner(ids: string[]): Promise<(Workspace & {
        owner: {
            email: string | null;
        } | null;
    })[]>;
}
export declare const drizzleWorkspaceRepository: DrizzleWorkspaceRepository;
//# sourceMappingURL=workspace.repository.d.ts.map