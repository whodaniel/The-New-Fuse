export declare class UpdateWebhookDto {
    name?: string;
    url?: string;
    events?: string[];
    active?: boolean;
    secret?: string;
    description?: string;
    headers?: Record<string, string>;
    retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
    };
}
//# sourceMappingURL=update-webhook.dto.d.ts.map