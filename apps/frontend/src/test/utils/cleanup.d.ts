export declare class TestCleanup {
    private static cleanupTasks;
    static register(cleanup: () => Promise<void>): void;
    static cleanupAll(): Promise<void>;
}
