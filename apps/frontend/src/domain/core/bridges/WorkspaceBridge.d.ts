export declare class WorkspaceBridge {
    constructor();
    static getInstance(): any;
    setupEventListeners(): void;
    handleWorkspaceUpdate(event: any): void;
    handleMemberUpdate(event: any): void;
    createWorkspace(config: any): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    getWorkspaceConfig(workspaceId: any): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    updateWorkspace(workspaceId: any, changes: any): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    addMember(workspaceId: any, userId: any, role: any): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    removeMember(workspaceId: any, userId: any): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    subscribeToWorkspaceUpdates(workspaceId: any, callback: any): any;
    subscribeTomemberUpdates(workspaceId: any, callback: any): any;
}
