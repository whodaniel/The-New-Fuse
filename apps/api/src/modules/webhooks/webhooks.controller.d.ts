import { Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { BusinessEventService } from './services/business-event.service';
import { SSEService } from './services/sse.service';
import { WebhookRegistrationRequest, WebhookRegistrationResponse, WebhookEventResponse, WebhookStatusResponse, EventHistoryRequest, EventHistoryResponse, IntegrationSource } from '@the-new-fuse/types';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly businessEventService;
    private readonly sseService;
    private readonly logger;
    constructor(webhooksService: WebhooksService, businessEventService: BusinessEventService, sseService: SSEService);
    registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookRegistrationResponse>;
    handleWebhook(source: IntegrationSource, payload: any, headers: Record<string, string>): Promise<WebhookEventResponse>;
    getWebhookStatus(id: string): Promise<WebhookStatusResponse>;
    getEventHistory(request: EventHistoryRequest, req: any): Promise<EventHistoryResponse>;
    streamEvents(req: any, res: Response, eventTypes?: string, filters?: string): Promise<void>;
    retryEvent(eventId: string): Promise<{
        success: boolean;
    }>;
    private extractSignature;
}
//# sourceMappingURL=webhooks.controller.d.ts.map