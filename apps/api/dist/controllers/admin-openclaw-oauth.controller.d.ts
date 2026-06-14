import { ExecuteOpenClawOAuthBindingDto, UpsertOpenClawOAuthBindingDto } from '../dto/openclaw-oauth-rotation.dto';
import { AuditService } from '../services/audit.service';
import { OpenClawOAuthBindingSummary, OpenClawOAuthExecutionResult, OpenClawOAuthRotationService } from '../services/openclaw-oauth-rotation.service';
export declare class AdminOpenClawOAuthController {
    private readonly rotationService;
    private readonly auditService;
    constructor(rotationService: OpenClawOAuthRotationService, auditService: AuditService);
    private assertSuperAdmin;
    private normalizeProvider;
    private getRotationAuditSnapshot;
    listBindings(user: any): Promise<OpenClawOAuthBindingSummary[]>;
    upsertBinding(user: any, dto: UpsertOpenClawOAuthBindingDto): Promise<OpenClawOAuthBindingSummary>;
    deleteBinding(user: any, tenantId: string, service: string, provider: string): Promise<{
        success: true;
    }>;
    execute(user: any, tenantId: string, service: string, provider: string, dto: ExecuteOpenClawOAuthBindingDto): Promise<OpenClawOAuthExecutionResult>;
    getActivity(user: any, limit?: string): Promise<{
        events: Array<{
            id: string;
            action: string;
            status: string;
            createdAt: string | null;
            userId: string | null;
            tenantId: string | null;
            service: string | null;
            provider: string | null;
            details: Record<string, unknown>;
        }>;
        rollup: {
            totals: {
                total: number;
                success: number;
                warning: number;
                error: number;
            };
            latestRunByService: Array<{
                service: string;
                provider: string;
                status: string;
                deployStatus: string | null;
                overviewStatus: number | null;
                at: string | null;
            }>;
            findings: Array<{
                severity: "P0" | "P1";
                service: string;
                provider: string;
                issue: string;
                at: string | null;
            }>;
        };
    }>;
}
//# sourceMappingURL=admin-openclaw-oauth.controller.d.ts.map