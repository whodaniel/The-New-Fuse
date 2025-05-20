import { WorkspaceConfig, Result } from '../types.js';
import { UserRole } from '../../../models/enums.js';
export interface WorkspaceUpdateEvent {
    workspaceId: string;
    changes: Partial<WorkspaceConfig>;
    userId: string;
    timestamp: number;
}
export declare class WorkspaceBridge {
    private static instance;
    private readonly communicationManager;
    private readonly eventBus;
    private readonly stateManager;
    private readonly logger;
    private constructor();
    static getInstance(): WorkspaceBridge;
    private setupEventListeners;
    private handleWorkspaceUpdate;
    private handleMemberUpdate;
    createWorkspace(config: Omit<WorkspaceConfig, 'id'>): Promise<Result<WorkspaceConfig>>;
    getWorkspaceConfig(workspaceId: string): Promise<Result<WorkspaceConfig>>;
    updateWorkspace(workspaceId: string, changes: Partial<WorkspaceConfig>): Promise<Result<void>>;
    addMember(workspaceId: string, userId: string, role: UserRole): Promise<Result<void>>;
    removeMember(workspaceId: string, userId: string): Promise<Result<void>>;
    subscribeToWorkspaceUpdates(workspaceId: string, callback: (config: WorkspaceConfig) => void): () => void;
    subscribeTomemberUpdates(workspaceId: string, callback: (members: Record<string, {
        role: UserRole;
    }>) => void): () => void;
}
