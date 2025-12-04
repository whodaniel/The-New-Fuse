export declare class StateManager {
    constructor();
    static getInstance(): any;
    setState(path: any, value: any): void;
    getState(path: any): any;
    subscribe(path: any, callback: any): () => void;
    notifySubscribers(path: any, value: any): void;
    addToHistory(event: any): void;
    getHistory(): any[];
    getHistoryForPath(path: any): any;
    clearHistory(): void;
    reset(): void;
    isEqual(a: any, b: any): any;
    getSnapshot(): any;
}
