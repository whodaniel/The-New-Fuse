import { EventEmitter } from 'events';
export interface Progress {
    id: string;
    type: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    message?: string;
    error?: string;
    metadata?: Record<string, any>;
}
export declare class ProgressTracker extends EventEmitter {
    private static instance;
    private tasks;
    private constructor();
    static getInstance(): ProgressTracker;
    startTask(type: string, metadata?: Record<string, any>): string;
    updateProgress(id: string, progress: number, message?: string): void;
    completeTask(id: string, message?: string): void;
    failTask(id: string, error: string): void;
    getTask(id: string): Progress | undefined;
    getAllTasks(): Progress[];
    removeTask(id: string): void;
    clearCompletedTasks(): void;
}
