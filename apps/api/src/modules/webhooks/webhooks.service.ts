// @ts-nocheck
/**
 * Webhooks Service - Migrated to Drizzle ORM
 * Manages webhook registrations and incoming webhook processing
 */
import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import {
  IntegrationSource,
  ProcessingStatus,
  WebhookEventResponse,
  WebhookRegistrationRequest,
  WebhookRegistrationResponse,
  WebhookStatusResponse,
} from '@the-new-fuse/types';
import { randomUUID } from 'crypto';
import { BusinessEventService } from './services/business-event.service.js';
import { IntegrationService } from './services/integration.service.js';
import { WebhookSecurityService } from './services/webhook-security.service.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly securityService: WebhookSecurityService,
    private readonly businessEventService: BusinessEventService,
    private readonly integrationService: IntegrationService
  ) {}

  async registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookRegistrationResponse> {
    try {
      // Generate webhook URL
      const webhookId = randomUUID();
      const webhookUrl = `${process.env.API_BASE_URL}/webhooks/incoming/${request.source}`;

      // Create webhook configuration
      const config = await this.db.webhooks.createWebhookConfiguration({
        id: webhookId,
        organizationId: request.organization_id || 'default',
        source: request.source,
        endpointUrl: request.endpoint_url,
        secretKey: request.secret_key,
        configuration: request.configuration || {},
        isActive: true,
      });

      this.logger.log(`Webhook registered for ${request.source}: ${config.id}`);

      return {
        id: config.id,
        status: 'registered',
        webhook_url: webhookUrl,
      };
    } catch (error) {
      this.logger.error('Failed to register webhook', error);
      return {
        id: '',
        status: 'error',
        webhook_url: '',
      };
    }
  }

  async handleWebhook(
    source: IntegrationSource,
    payload: any,
    signature: string
  ): Promise<WebhookEventResponse> {
    try {
      // Get webhook configuration for source
      const config = await this.db.webhooks.findActiveWebhookBySource(source);

      if (!config) {
        throw new Error(`No active webhook configuration found for ${source}`);
      }

      // Validate webhook signature
      const isValid = await this.securityService.validateSignature(
        JSON.stringify(payload),
        signature,
        {
          signatureHeader: this.getSignatureHeader(source),
          secret: config.secretKey,
          algorithm: 'sha256',
          tolerance: 300, // 5 minutes
        }
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Transform payload to business event
      const businessEvent = await this.integrationService.transformToBusinessEvent(
        source,
        payload,
        config.organizationId
      );

      // Save business event
      const savedEvent = await this.businessEventService.createEvent({
        ...businessEvent,
        organizationId: config.organizationId,
      } as any);

      // Process event asynchronously
      setImmediate(() => {
        this.businessEventService.processEvent(savedEvent.id).catch((error) => {
          this.logger.error(`Failed to process event ${savedEvent.id}`, error);
        });
      });

      this.logger.log(`Webhook processed for ${source}: ${savedEvent.id}`);

      return {
        received: true,
        event_id: savedEvent.id,
      };
    } catch (error) {
      this.logger.error(`Failed to handle webhook from ${source}`, error);
      return {
        received: false,
      };
    }
  }

  async getWebhookStatus(id: string): Promise<WebhookStatusResponse> {
    try {
      const config = await this.db.webhooks.findWebhookConfigurationById(id);

      if (!config) {
        throw new Error(`Webhook configuration not found: ${id}`);
      }

      // Get recent events count
      const eventCount = await this.db.webhooks.countBusinessEvents(config.organizationId);

      // Get last received event
      const lastEvent = await this.db.webhooks.findLastEventByOrganization(config.organizationId);

      return {
        id: config.id,
        status: config.isActive ? 'active' : 'inactive',
        last_received: lastEvent?.createdAt?.toISOString() || '',
        event_count: eventCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get webhook status for ${id}`, error);
      throw error;
    }
  }

  private getSignatureHeader(source: IntegrationSource): string {
    const headers: Record<string, string> = {
      [IntegrationSource.STRIPE]: 'stripe-signature',
      [IntegrationSource.PAYPAL]: 'paypal-transmission-sig',
      [IntegrationSource.SALESFORCE]: 'x-salesforce-webhook-signature',
      [IntegrationSource.HUBSPOT]: 'x-hubspot-signature',
      [IntegrationSource.PIPEDRIVE]: 'x-pipedrive-signature',
      [IntegrationSource.SQUARE]: 'x-square-signature',
      [IntegrationSource.NETSUITE]: 'x-netsuite-signature',
      [IntegrationSource.SAP]: 'x-sap-signature',
      [IntegrationSource.QUICKBOOKS]: 'intuit-signature',
      [IntegrationSource.ZAPIER]: 'x-zapier-signature',
      [IntegrationSource.WORKATO]: 'x-workato-signature',
      [IntegrationSource.POWER_AUTOMATE]: 'x-ms-signature',
    };

    return headers[source] || 'x-webhook-signature';
  }

  async deactivateWebhook(id: string): Promise<void> {
    await this.db.webhooks.updateWebhookConfiguration(id, { isActive: false });
    this.logger.log(`Webhook deactivated: ${id}`);
  }

  async reactivateWebhook(id: string): Promise<void> {
    await this.db.webhooks.updateWebhookConfiguration(id, { isActive: true });
    this.logger.log(`Webhook reactivated: ${id}`);
  }

  async getWebhooksByOrganization(organizationId: string): Promise<any[]> {
    return this.db.webhooks.findWebhookConfigurationsByOrganization(organizationId);
  }

  async updateWebhookConfiguration(
    id: string,
    updates: { endpointUrl?: string; secretKey?: string; configuration?: Record<string, any> }
  ): Promise<void> {
    await this.db.webhooks.updateWebhookConfiguration(id, updates);
    this.logger.log(`Webhook configuration updated: ${id}`);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.db.webhooks.deleteWebhookConfiguration(id);
    this.logger.log(`Webhook deleted: ${id}`);
  }

  async getWebhookMetrics(organizationId: string): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalEvents: number;
    failedEvents: number;
    processingLatency: number;
  }> {
    const totalWebhooks = await this.db.webhooks.countWebhookConfigurations(organizationId);
    const activeWebhooks = await this.db.webhooks.countWebhookConfigurations(organizationId, true);
    const totalEvents = await this.db.webhooks.countBusinessEvents(organizationId);
    const failedEvents = await this.db.webhooks.countBusinessEvents(
      organizationId,
      ProcessingStatus.FAILED
    );

    // Calculate average processing latency - simplified
    const recentEvents = await this.db.webhooks.findBusinessEventsByStatus(
      ProcessingStatus.COMPLETED,
      100
    );

    const processingLatency =
      recentEvents.reduce((acc, event) => {
        if (event.processedAt) {
          const latency =
            new Date(event.processedAt).getTime() - new Date(event.createdAt).getTime();
          return acc + latency;
        }
        return acc;
      }, 0) / Math.max(recentEvents.length, 1);

    return {
      totalWebhooks,
      activeWebhooks,
      totalEvents,
      failedEvents,
      processingLatency: Math.round(processingLatency),
    };
  }
}
