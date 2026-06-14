export declare class StateService {
    private state;
    private readonly logger;
    constructor();
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
    getKeys(): Promise<string[]>;
    clear(): Promise<void>;
}
//# sourceMappingURL=StateService.d.ts.map