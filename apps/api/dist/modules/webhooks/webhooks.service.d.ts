import { DatabaseService } from '@the-new-fuse/database';
import { IntegrationSource, WebhookEventResponse, WebhookRegistrationRequest, WebhookRegistrationResponse, WebhookStatusResponse } from '@the-new-fuse/types';
import { BusinessEventService } from './services/business-event.service';
import { IntegrationService } from './services/integration.service';
import { WebhookSecurityService } from './services/webhook-security.service';
export declare class WebhooksService {
    private readonly db;
    private readonly securityService;
    private readonly businessEventService;
    private readonly integrationService;
    private readonly logger;
    constructor(db: DatabaseService, securityService: WebhookSecurityService, businessEventService: BusinessEventService, integrationService: IntegrationService);
    registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookRegistrationResponse>;
    handleWebhook(source: IntegrationSource, payload: any, signature: string): Promise<WebhookEventResponse>;
    getWebhookStatus(id: string): Promise<WebhookStatusResponse>;
    private getSignatureHeader;
    deactivateWebhook(id: string): Promise<void>;
    reactivateWebhook(id: string): Promise<void>;
    getWebhooksByOrganization(organizationId: string): Promise<any[]>;
    updateWebhookConfiguration(id: string, updates: {
        endpointUrl?: string;
        secretKey?: string;
        configuration?: Record<string, any>;
    }): Promise<void>;
    deleteWebhook(id: string): Promise<void>;
    getWebhookMetrics(organizationId: string): Promise<{
        totalWebhooks: number;
        activeWebhooks: number;
        totalEvents: number;
        failedEvents: number;
        processingLatency: number;
    }>;
}
//# sourceMappingURL=webhooks.service.d.ts.map