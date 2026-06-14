import { DatabaseService } from '@the-new-fuse/database';
interface OrchestrationChatRequest {
    message: string;
    systemPrompt?: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    context?: {
        tenantId?: string;
        agencyId?: string;
        workspaceId?: string;
        userId?: string;
        [key: string]: unknown;
    };
}
type AuthUser = {
    id?: string;
    tenantId?: string;
    agencyId?: string;
    roles?: string[];
    permissions?: string[];
    email?: string | null;
};
export declare class OrchestrationController {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    chat(body: OrchestrationChatRequest, user: AuthUser): Promise<{
        response: string;
        provider: string;
        model: string;
        context: {
            tenantId: unknown;
            agencyId: unknown;
            userId: unknown;
        };
    }>;
    private normalizeContext;
    private assertContextAccess;
    private normalizeProvider;
    private resolveProviderForUser;
    private resolveSpecificProvider;
    private safeLoadEnabledConfigs;
    private defaultModelForProvider;
    private resolveChatEndpoint;
    private buildHeaders;
    private buildPayload;
    private extractTextContent;
    private executeChatCompletion;
    private tryParseJson;
}
export {};
//# sourceMappingURL=orchestration.controller.d.ts.map