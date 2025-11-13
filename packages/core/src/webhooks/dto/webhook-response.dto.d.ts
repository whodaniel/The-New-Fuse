export declare class WebhookResponseDto {
    id: string;
    name: string;
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
    description?: string;
    headers?: Record<string, string>;
    retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=webhook-response.dto.d.ts.map