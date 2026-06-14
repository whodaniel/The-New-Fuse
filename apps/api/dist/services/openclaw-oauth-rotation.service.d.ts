import { OpenClawOAuthAccessScope, OpenClawProvider, UpsertOpenClawOAuthBindingDto } from '../dto/openclaw-oauth-rotation.dto';
export interface OpenClawOAuthBindingSummary {
    key: string;
    tenantId: string;
    service: string;
    provider: OpenClawProvider;
    accessScope: OpenClawOAuthAccessScope;
    hasAccountId: boolean;
    updatedAt: Date;
    updatedBy: string | null;
}
export interface OpenClawOAuthExecutionResult {
    service: string;
    provider: OpenClawProvider;
    deployStatus: string | null;
    deployId: string | null;
    deployCreatedAt: string | null;
    overviewStatus: number | null;
    verified: {
        primaryModel: string;
        fallbackModels: string;
        useCodexOAuth?: string;
        accountId?: string;
    };
}
export declare class OpenClawOAuthRotationService {
    private getEncryptionKey;
    private encrypt;
    private decrypt;
    private makeKey;
    private parseKey;
    listBindings(): Promise<OpenClawOAuthBindingSummary[]>;
    upsertBinding(userId: string, dto: UpsertOpenClawOAuthBindingDto): Promise<OpenClawOAuthBindingSummary>;
    deleteBinding(tenantId: string, service: string, provider: OpenClawProvider): Promise<void>;
    private runCloudRuntime;
    private getServiceDeployment;
    private getVars;
    private waitForSuccess;
    private checkOverview;
    executeBinding(tenantId: string, service: string, provider: OpenClawProvider, opts?: {
        waitForSuccess?: boolean;
        timeoutSeconds?: number;
    }): Promise<OpenClawOAuthExecutionResult>;
}
//# sourceMappingURL=openclaw-oauth-rotation.service.d.ts.map