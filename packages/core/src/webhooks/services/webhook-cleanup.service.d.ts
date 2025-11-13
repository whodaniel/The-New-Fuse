export declare class WebhookCleanupService {
    constructor();
    cleanupOldDeliveries(retentionDays?: number): Promise<{
        cleaned: number;
        retentionDays: number;
    }>;
    cleanupFailedDeliveries(maxAge?: number): Promise<{
        cleaned: number;
        maxAge: number;
    }>;
}
//# sourceMappingURL=webhook-cleanup.service.d.ts.map