export declare class TaskBridge {
    constructor();
    static getInstance(): any;
    setupEventListeners(): void;
    handleTaskUpdate(event: any): void;
    handleStatusChange(event: any): void;
    createTask(task: any): Promise<{
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
    getTask(taskId: any): Promise<{
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
    updateTask(taskId: any, changes: any): Promise<{
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
    updateStatus(taskId: any, status: any): Promise<{
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
    assignTask(taskId: any, userId: any): Promise<{
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
    updatePriority(taskId: any, priority: any): Promise<{
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
    subscribeToTaskUpdates(taskId: any, callback: any): any;
    subscribeToStatusUpdates(taskId: any, callback: any): any;
}
