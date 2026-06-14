export interface CronJob {
    id: string;
    name: string;
    schedule: string;
    command: string;
    enabled: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
    lastRun?: string;
    nextRun?: string;
    runCount: number;
    failCount: number;
    tags?: string[];
}
export declare class CronService {
    private readonly jobsPath;
    constructor();
    private readJobs;
    private writeJobs;
    list(): Promise<CronJob[]>;
    add(id: string, schedule: string, command: string, options?: {
        description?: string;
        disabled?: boolean;
    }): Promise<CronJob>;
    remove(id: string): Promise<void>;
    enable(id: string): Promise<CronJob>;
    disable(id: string): Promise<CronJob>;
    get(id: string): Promise<CronJob | undefined>;
    update(id: string, updates: Partial<Omit<CronJob, 'id'>>): Promise<CronJob>;
    private getDefaultJobs;
}
//# sourceMappingURL=CronService.d.ts.map