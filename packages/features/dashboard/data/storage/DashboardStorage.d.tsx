export declare class DashboardStorage {
    private storage;
    private prefix;
    constructor(storage?: Storage, prefix?: string);
    saveDashboard(): Promise<void>;
}
