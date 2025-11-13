export declare class CreateWebhookDto {
    name: string;
    url: string;
    events: string[];
    active?: boolean;
    secret?: string;
    description?: string;
    headers?: Record<string, string>;
    retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
    };
}
//# sourceMappingURL=create-webhook.dto.d.ts.map