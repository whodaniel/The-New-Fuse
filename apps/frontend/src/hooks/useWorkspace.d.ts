interface WorkspaceState {
    loading: boolean;
    error: Error | null;
    workspace?: any;
}
export declare const useWorkspace: () => WorkspaceState;
export {};
