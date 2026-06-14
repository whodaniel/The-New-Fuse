import { AuditService } from '../services/audit.service';
import { OpenClawRuntimeService } from '../services/openclaw-runtime.service';
export declare class AdminOpenClawRuntimeController {
    private readonly openClawRuntimeService;
    private readonly auditService;
    constructor(openClawRuntimeService: OpenClawRuntimeService, auditService: AuditService);
    private assertSuperAdmin;
    private getActorId;
    private toTargetOptions;
    listInstances(_user: any): Promise<{
        [x: string]: unknown;
    }>;
    getInventory(_user: any, installationId?: string, instanceId?: string, stateDir?: string, allInstances?: string): Promise<{
        [x: string]: unknown;
    }>;
    getConfig(_user: any, path?: string, installationId?: string, instanceId?: string, stateDir?: string, allInstances?: string): Promise<{
        [x: string]: unknown;
    }>;
    setConfig(user: any, body: {
        path: string;
        value: string;
        valueType?: 'string' | 'number' | 'boolean' | 'json' | 'null';
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
    }): Promise<{
        [x: string]: unknown;
    }>;
    unsetConfig(user: any, body: {
        path: string;
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
    }): Promise<{
        [x: string]: unknown;
    }>;
    listCron(_user: any, installationId?: string, instanceId?: string, stateDir?: string, allInstances?: string): Promise<{
        [x: string]: unknown;
    }>;
    enableCron(user: any, body: {
        job: string;
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
    }): Promise<{
        [x: string]: unknown;
    }>;
    disableCron(user: any, body: {
        job: string;
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
    }): Promise<{
        [x: string]: unknown;
    }>;
    scheduleCron(user: any, body: {
        job: string;
        cron?: string;
        tz?: string;
        staggerMs?: string | number;
        everyMs?: string | number;
        anchorMs?: string | number;
        at?: string;
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
    }): Promise<{
        [x: string]: unknown;
    }>;
    syncControlPlane(user: any, body?: {
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
        allInstances?: boolean | string;
    }): Promise<{
        [x: string]: unknown;
    }>;
    cleanupCron(user: any, body: {
        dryRun?: boolean;
        disableFailing?: boolean;
        keepLaunchValidationDuplicates?: boolean;
        installationId?: string;
        instanceId?: string;
        stateDir?: string;
        allInstances?: boolean | string;
    }): Promise<{
        [x: string]: unknown;
    }>;
}
//# sourceMappingURL=admin-openclaw-runtime.controller.d.ts.map