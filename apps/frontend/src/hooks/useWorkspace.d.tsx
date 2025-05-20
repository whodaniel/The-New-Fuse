interface Workspace {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    memberCount: number;
    projectCount: number;
    lastActivity?: string;
}
export declare const useWorkspace: () => {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    loading: boolean;
    error: Error | null;
    createWorkspace: () => Promise<void>;
    selectWorkspace: (workspaceId: string) => void;
    updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<void>;
    deleteWorkspace: (workspaceId: string) => Promise<void>;
};
export default useWorkspace;
