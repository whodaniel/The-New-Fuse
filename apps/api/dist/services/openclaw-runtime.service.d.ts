type JsonRecord = Record<string, unknown>;
type OpenClawRuntimeTargetOptions = {
    installationId?: string;
    instanceId?: string;
    stateDir?: string;
    allInstances?: boolean;
};
export declare class OpenClawRuntimeService {
    private readonly repoRoot;
    private readonly scriptPath;
    listInstances(): Promise<JsonRecord>;
    getInventory(target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    getConfig(pathExpression?: string, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    setConfig(pathExpression: string, value: string, valueType?: string, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    unsetConfig(pathExpression: string, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    listCronJobs(target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    enableCronJob(jobReference: string, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    disableCronJob(jobReference: string, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    scheduleCronJob(jobReference: string, options: {
        cron?: string;
        tz?: string;
        staggerMs?: string | number;
        everyMs?: string | number;
        anchorMs?: string | number;
        at?: string;
    }, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    syncControlPlane(actorId: string, target?: OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    cleanupCron(actorId: string, options?: {
        dryRun?: boolean;
        disableFailing?: boolean;
        keepLaunchValidationDuplicates?: boolean;
    } & OpenClawRuntimeTargetOptions): Promise<JsonRecord>;
    private buildTargetArgs;
    private runScript;
    private resolveRepoRoot;
}
export {};
//# sourceMappingURL=openclaw-runtime.service.d.ts.map