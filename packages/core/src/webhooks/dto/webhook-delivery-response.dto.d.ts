export declare class WebhookDeliveryResponseDto {
    id: string;
    webhookId: string;
    event: string;
    payload: any;
    status: 'pending' | 'delivered' | 'failed';
    statusCode?: number;
    response?: string;
    error?: string;
    attempts: number;
    maxAttempts: number;
    nextRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=webhook-delivery-response.dto.d.ts.map