export declare class WebhookSchedulerService {
    constructor();
    scheduleRetry(deliveryId: string, retryAt: Date): Promise<{
        deliveryId: string;
        retryAt: Date;
        scheduled: boolean;
    }>;
    processRetries(): Promise<{
        processed: number;
    }>;
}
//# sourceMappingURL=webhook-scheduler.service.d.ts.map