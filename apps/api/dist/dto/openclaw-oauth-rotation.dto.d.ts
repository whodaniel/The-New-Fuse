export declare const OPENCLAW_PROVIDERS: readonly ["openai-codex", "anthropic", "google-antigravity", "kilo"];
export type OpenClawProvider = (typeof OPENCLAW_PROVIDERS)[number];
export declare const OPENCLAW_OAUTH_ACCESS_SCOPES: readonly ["personal", "service"];
export type OpenClawOAuthAccessScope = (typeof OPENCLAW_OAUTH_ACCESS_SCOPES)[number];
export declare class UpsertOpenClawOAuthBindingDto {
    tenantId: string;
    service: string;
    provider: OpenClawProvider;
    accessToken: string;
    refreshToken: string;
    accountId?: string;
    googleEmail?: string;
    googleProjectId?: string;
    accessScope?: OpenClawOAuthAccessScope;
    teamWideApproved?: boolean;
    primaryModel: string;
    fallbackModels: string;
}
export declare class ExecuteOpenClawOAuthBindingDto {
    waitForSuccess?: boolean;
    timeoutSeconds?: number;
}
//# sourceMappingURL=openclaw-oauth-rotation.dto.d.ts.map