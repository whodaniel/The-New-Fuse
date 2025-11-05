import { Repository } from 'typeorm';
import { BusinessEvent as IBusinessEvent, EventHistoryRequest, EventHistoryResponse, ProcessingStatus } from '@the-new-fuse/types';
import { BusinessEvent } from '../entities/business-event.entity';
import { SSEService } from './sse.service';
export declare class BusinessEventService {
    private readonly businessEventRepo;
    private readonly sseService;
    private readonly logger;
    constructor(businessEventRepo: Repository<BusinessEvent>, sseService: SSEService);
    createEvent(eventData: Omit<IBusinessEvent, 'id' | 'timestamp'>): Promise<BusinessEvent>;
    processEvent(eventId: string): Promise<void>;
    private processEventByType;
    private processLeadCreated;
    private processPaymentReceived;
    private processInvoiceGenerated;
    private processWorkflowTriggered;
    private processCustomerUpdated;
    private processProductSold;
    private processSubscriptionChanged;
    getEventHistory(organizationId: string, request: EventHistoryRequest): Promise<EventHistoryResponse>;
    retryFailedEvent(eventId: string): Promise<void>;
    getEventsByStatus(organizationId: string, status: ProcessingStatus): Promise<BusinessEvent[]>;
    getEventStats(organizationId: string, days?: number): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByStatus: Record<string, number>;
        averageProcessingTime: number;
    }>;
    private mapEntityToInterface;
}
//# sourceMappingURL=business-event.service.d.ts.map