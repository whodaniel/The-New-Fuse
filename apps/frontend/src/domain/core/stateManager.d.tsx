export interface StateChangeEvent<T = any> {
    path: string[];
    oldValue: T;
    newValue: T;
    timestamp: number;
}
export declare class StateManager {
    private static instance;
    private state;
    private readonly eventBus;
    private readonly logger;
    private readonly subscribers;
    private stateHistory;
    private readonly maxHistorySize;
    private constructor();
    static getInstance(): StateManager;
    setState<T>(path: string[], value: T): void;
    getState<T>(path: string[]): T | undefined;
    subscribe(path: string[], callback: (value: any) => void): () => void;
    private notifySubscribers;
    private addToHistory;
    getHistory(): StateChangeEvent[];
    getHistoryForPath(path: string[]): StateChangeEvent[];
    clearHistory(): void;
    reset(): void;
    private isEqual;
    getSnapshot(): Record<string, any>;
}
