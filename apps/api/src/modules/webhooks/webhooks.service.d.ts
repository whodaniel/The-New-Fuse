import { Repository } from 'typeorm';
import { WebhookRegistrationRequest, WebhookRegistrationResponse, WebhookEventResponse, WebhookStatusResponse, IntegrationSource } from '@the-new-fuse/types';
import { WebhookConfiguration } from './entities/webhook-configuration.entity';
import { BusinessEvent } from './entities/business-event.entity';
import { WebhookSecurityService } from './services/webhook-security.service';
import { BusinessEventService } from './services/business-event.service';
import { IntegrationService } from './services/integration.service';
export declare class WebhooksService {
    private readonly webhookConfigRepo;
    private readonly businessEventRepo;
    private readonly securityService;
    private readonly businessEventService;
    private readonly integrationService;
    private readonly logger;
    constructor(webhookConfigRepo: Repository<WebhookConfiguration>, businessEventRepo: Repository<BusinessEvent>, securityService: WebhookSecurityService, businessEventService: BusinessEventService, integrationService: IntegrationService);
    registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookRegistrationResponse>;
    handleWebhook(source: IntegrationSource, payload: any, signature: string): Promise<WebhookEventResponse>;
    getWebhookStatus(id: string): Promise<WebhookStatusResponse>;
    private getSignatureHeader;
    deactivateWebhook(id: string): Promise<void>;
    reactivateWebhook(id: string): Promise<void>;
    getWebhooksByOrganization(organizationId: string): Promise<WebhookConfiguration[]>;
    updateWebhookConfiguration(id: string, updates: Partial<Pick<WebhookConfiguration, 'endpointUrl' | 'secretKey' | 'configuration'>>): Promise<void>;
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