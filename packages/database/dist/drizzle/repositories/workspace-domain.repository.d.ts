import type { NewWorkspaceDomain, WorkspaceDomain } from '../types/index.js';
export declare class DrizzleWorkspaceDomainRepository {
    listByWorkspace(workspaceId: string): Promise<WorkspaceDomain[]>;
    findById(workspaceId: string, id: string): Promise<WorkspaceDomain | null>;
    findByDomain(domain: string): Promise<WorkspaceDomain | null>;
    addDomain(data: Omit<NewWorkspaceDomain, 'id'> & {
        id?: string;
    }): Promise<WorkspaceDomain>;
    removeDomain(workspaceId: string, id: string): Promise<boolean>;
    updateStatus(workspaceId: string, id: string, status: WorkspaceDomain['status'], verificationMessage: string | null): Promise<WorkspaceDomain | null>;
}
export declare const drizzleWorkspaceDomainRepository: DrizzleWorkspaceDomainRepository;
//# sourceMappingURL=workspace-domain.repository.d.ts.map