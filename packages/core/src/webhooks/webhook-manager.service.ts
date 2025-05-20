import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../services/LoggingService.js';
import { IntegrationRegistryService } from '../integration/services/integration-registry.service.js';
import { WorkflowTriggerService } from '../workflow/services/workflow-trigger.service.js';
import * as crypto from 'crypto';

interface WebhookRegistration {
  id: string;
  integrationId: string;
  eventType: string;
  secret: string;
  createdAt: Date;
  url: string;
}

/**
 * Manages webhooks for integrations
 */
@Injectable()
export class WebhookManager {
  private readonly logger: Logger;
  private webhooks: Map<string, WebhookRegistration> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly integrationRegistry: IntegrationRegistryService,
    private readonly workflowTrigger: WorkflowTriggerService
  ) {
    this.logger = this.loggingService.createLogger('WebhookManager');
  }

  /**
   * Register a new webhook for an integration
   */
  async registerWebhook(integrationId: string, eventType: string): Promise<string> {
    const integration = this.integrationRegistry.getIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    if (!integration.capabilities?.supportsWebhooks) {
      throw new Error(`Integration ${integrationId} does not support webhooks`);
    }

    // Generate unique webhook ID and secret
    const webhookId = crypto.randomUUID();
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    
    const url = this.getWebhookUrl(webhookId);

    try {
      // Register webhook with the integration
      await this.integrationRegistry.executeIntegrationAction(integrationId, 'create_webhook', {
        url,
        secret: webhookSecret,
        eventType
      });

      // Store webhook registration
      this.webhooks.set(webhookId, {
        id: webhookId,
        integrationId,
        eventType,
        secret: webhookSecret,
        createdAt: new Date(),
        url
      });

      this.logger.info(`Registered webhook for integration ${integrationId}`, {
        webhookId,
        eventType
      });

      return webhookId;
    } catch (error) {
      this.logger.error(`Failed to register webhook for integration ${integrationId}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(webhookId: string, payload: any, headers: Record<string, string>): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Invalid webhook ID: ${webhookId}`);
    }

    // Verify webhook signature if provided
    if (headers['x-webhook-signature']) {
      this.verifyWebhookSignature(payload, headers['x-webhook-signature'], webhook.secret);
    }

    try {
      // Trigger workflows that are listening for this webhook
      await this.workflowTrigger.triggerWebhookWorkflows(webhookId, {
        integrationId: webhook.integrationId,
        eventType: webhook.eventType,
        payload,
        timestamp: new Date()
      });
      
      this.logger.info(`Successfully processed webhook ${webhookId}`);
    } catch (error) {
      this.logger.error(`Error processing webhook ${webhookId}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    try {
      // Call integration to delete the webhook
      await this.integrationRegistry.executeIntegrationAction(
        webhook.integrationId, 
        'delete_webhook', 
        { webhookId }
      );
      
      // Remove from local registry
      this.webhooks.delete(webhookId);
      this.logger.info(`Unregistered webhook ${webhookId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister webhook ${webhookId}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List all webhooks for an integration
   */
  listWebhooks(integrationId?: string): WebhookRegistration[] {
    const webhooks = Array.from(this.webhooks.values());
    
    if (integrationId) {
      return webhooks.filter(webhook => webhook.integrationId === integrationId);
    }
    
    return webhooks;
  }

  /**
   * Get webhook URL based on ID
   */
  private getWebhookUrl(webhookId: string): string {
    const baseUrl = this.configService.get<string>('app.baseUrl') || 'http://localhost:3000';
    return `${baseUrl}/webhooks/${webhookId}`;
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string, secret: string): void {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (computedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }
  }
}