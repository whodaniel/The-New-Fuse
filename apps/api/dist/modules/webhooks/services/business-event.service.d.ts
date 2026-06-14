import { DatabaseService } from '@the-new-fuse/database';
interface CreateBusinessEventData {
    type: string;
    source: string;
    organizationId: string;
    userId?: string;
    correlationId?: string;
    data: any;
    metadata?: any;
}
interface BusinessEventHistoryRequest {
    limit?: number;
    eventTypes?: string[];
    status?: string;
}
interface BusinessEventHistoryResponse {
    events: any[];
    total: number;
}
type BusinessEventEntity = {
    id: string;
    type: string;
    source: string;
    organizationId: string;
    userId?: string | null;
    correlationId?: string | null;
    data: unknown;
    metadata: unknown;
    processingStatus: string;
    retryCount: number;
    createdAt: Date;
    updatedAt: Date;
    processedAt?: Date | null;
};
export declare class BusinessEventService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    createEvent(eventData: CreateBusinessEventData): Promise<BusinessEventEntity>;
    processEvent(eventId: string): Promise<void>;
    private processEventByType;
    private processLeadCreated;
    private processPaymentReceived;
    private processInvoiceGenerated;
    private processWorkflowTriggered;
    private processCustomerUpdated;
    private processProductSold;
    private processSubscriptionChanged;
    getEventHistory(organizationId: string, request: BusinessEventHistoryRequest): Promise<BusinessEventHistoryResponse>;
    retryFailedEvent(eventId: string): Promise<void>;
    getEventsByStatus(organizationId: string, status: string): Promise<BusinessEventEntity[]>;
    getEventStats(organizationId: string, days?: number): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByStatus: Record<string, number>;
        averageProcessingTime: number;
    }>;
}
export {};
//# sourceMappingURL=business-event.service.d.ts.map