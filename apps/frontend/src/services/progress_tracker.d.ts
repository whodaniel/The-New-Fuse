export declare class ProgressTracker extends EventEmitter {
    constructor();
    static getInstance(): any;
    startTask(type: any, metadata: any): `${string}-${string}-${string}-${string}-${string}`;
    updateProgress(id: any, progress: any, message: any): void;
    completeTask(id: any, message: any): void;
    failTask(id: any, error: any): void;
    getTask(id: any): any;
    getAllTasks(): unknown[];
    removeTask(id: any): void;
    clearCompletedTasks(): void;
}
