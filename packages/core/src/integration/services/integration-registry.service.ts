import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../services/LoggingService.js';
import { Integration, IntegrationType, AuthType } from '@the-new-fuse/api-client/src/integrations/types';
import { Logger } from 'winston';
import { CredentialVault } from '../../security/CredentialVault.js';

// Import integration factories from api-client package
import { createHuggingFaceIntegration } from '@the-new-fuse/api-client/src/integrations/ai/huggingface';
import { createOpenAIIntegration } from '@the-new-fuse/api-client/src/integrations/ai/openai';
import { createAnthropicIntegration } from '@the-new-fuse/api-client/src/integrations/ai/anthropic'; // Added import
import { createPabblyIntegration } from '@the-new-fuse/api-client/src/integrations/automation/pabbly';
import { createShopifyIntegration } from '@the-new-fuse/api-client/src/integrations/ecommerce/shopify';
import { createZapierIntegration } from '@the-new-fuse/api-client/src/integrations/automation/zapier';
import { createMakeIntegration } from '@the-new-fuse/api-client/src/integrations/automation/make';
import { createN8nIntegration } from '@the-new-fuse/api-client/src/integrations/automation/n8n';
import { createTwitterIntegration } from '@the-new-fuse/api-client/src/integrations/social_media/twitter';
import { createLinkedInIntegration } from '@the-new-fuse/api-client/src/integrations/social_media/linkedin';
import { createSalesforceIntegration } from '@the-new-fuse/api-client/src/integrations/crm/salesforce.service'; // Assuming file name reflects service

/**
 * This service manages all external API integrations for The New Fuse platform.
 */
@Injectable()
export class IntegrationRegistryService implements OnModuleInit {
  private integrations: Map<string, Integration> = new Map(); // Use Integration type
  private logger: Logger; // Use Logger type
  private credentialVault: CredentialVault;

  constructor(
    private configService: ConfigService,
    private loggingService: LoggingService,
    credentialVault: CredentialVault
  ) {
    this.logger = this.loggingService.createLogger('IntegrationRegistryService');
    this.credentialVault = credentialVault;
  }

  /**
   * Initialize integrations when the module starts
   */
  async onModuleInit() {
    this.logger.info('Initializing Integration Registry'); // Use info level
    await this.registerDefaultIntegrations();
    this.logger.info('Integration Registry Initialized', { count: this.integrations.size });
  }

  /**
   * Register built-in integrations based on configuration
   */
  private async registerDefaultIntegrations() {
    this.logger.info('Registering default integrations...');
    try {
      // Register AI integrations
      if (this.configService.get<string>('integrations.huggingface.apiKey')) {
        this.registerIntegration(createHuggingFaceIntegration({
          apiKey: this.configService.get<string>('integrations.huggingface.apiKey'),
          model: this.configService.get<string>('integrations.huggingface.defaultModel'),
          useInferenceEndpoint: this.configService.get<boolean>('integrations.huggingface.useInferenceEndpoint', true)
        }));
      } else {
         this.logger.warn('Hugging Face API key not found, skipping registration.');
      }

      if (this.configService.get<string>('integrations.openai.apiKey')) {
        this.registerIntegration(createOpenAIIntegration({
          apiKey: this.configService.get<string>('integrations.openai.apiKey'),
          organization: this.configService.get<string>('integrations.openai.organization'),
          model: this.configService.get<string>('integrations.openai.defaultModel', 'gpt-4'),
          defaultMaxTokens: this.configService.get<number>('integrations.openai.defaultMaxTokens', 1000),
          defaultTemperature: this.configService.get<number>('integrations.openai.defaultTemperature', 0.7)
        }));
      } else {
         this.logger.warn('OpenAI API key not found, skipping registration.');
      }

      if (this.configService.get<string>('integrations.anthropic.apiKey')) {
        this.registerIntegration(createAnthropicIntegration({
          apiKey: this.configService.get<string>('integrations.anthropic.apiKey'),
          model: this.configService.get<string>('integrations.anthropic.defaultModel'),
          anthropicVersion: this.configService.get<string>('integrations.anthropic.versionHeader'),
          defaultMaxTokens: this.configService.get<number>('integrations.anthropic.defaultMaxTokens'),
          defaultTemperature: this.configService.get<number>('integrations.anthropic.defaultTemperature')
        }));
      } else {
        this.logger.warn('Anthropic API key not found, skipping registration.');
      }

      // Register automation integrations
       if (this.configService.get<string>('integrations.pabbly.apiKey')) {
        this.registerIntegration(createPabblyIntegration({
          apiKey: this.configService.get<string>('integrations.pabbly.apiKey'),
          // Add other Pabbly config if needed from ConfigService
        }));
      } else {
         this.logger.warn('Pabbly API key not found, skipping registration.');
      }

      if (this.configService.get<string>('integrations.zapier.apiKey')) {
         this.registerIntegration(createZapierIntegration({
           apiKey: this.configService.get<string>('integrations.zapier.apiKey'),
           // Add other Zapier config if needed
         }));
      } else {
         this.logger.warn('Zapier API key not found, skipping registration.');
      }

       if (this.configService.get<string>('integrations.make.apiKey')) {
         this.registerIntegration(createMakeIntegration({
           apiKey: this.configService.get<string>('integrations.make.apiKey'),
           // Add other Make config if needed
         }));
       } else {
          this.logger.warn('Make API key not found, skipping registration.');
       }

       if (this.configService.get<string>('integrations.n8n.apiKey') && this.configService.get<string>('integrations.n8n.instanceUrl')) {
         this.registerIntegration(createN8nIntegration({
           apiKey: this.configService.get<string>('integrations.n8n.apiKey'),
           instanceUrl: this.configService.get<string>('integrations.n8n.instanceUrl'),
           // Add other n8n config if needed
         }));
       } else {
          this.logger.warn('n8n API key or instance URL not found, skipping registration.');
       }


      // Register ecommerce integrations
      if (this.configService.get<string>('integrations.shopify.shopName') && this.configService.get<string>('integrations.shopify.accessToken')) {
        this.registerIntegration(createShopifyIntegration({
          shopName: this.configService.get<string>('integrations.shopify.shopName'),
          accessToken: this.configService.get<string>('integrations.shopify.accessToken'),
          // Add other Shopify config if needed
        }));
      } else {
         this.logger.warn('Shopify shop name or access token not found, skipping registration.');
      }

      // Register CRM integrations
      // Example for Salesforce - requires more complex OAuth setup usually handled during connection flow
      // For now, register it so it's discoverable, connection happens later.
      this.registerIntegration(createSalesforceIntegration({
          // Initial config might be minimal, actual connection details added later
          clientId: this.configService.get<string>('integrations.salesforce.clientId'), // Example config
      }));


       // Register Social Media integrations
       // Example for Twitter - requires OAuth setup
       this.registerIntegration(createTwitterIntegration({
           // Initial config might be minimal
           apiKey: this.configService.get<string>('integrations.twitter.apiKey'), // Example config
           apiSecretKey: this.configService.get<string>('integrations.twitter.apiSecretKey'), // Example config
       }));

       // Example for LinkedIn - requires OAuth setup
       this.registerIntegration(createLinkedInIntegration({
           // Initial config might be minimal
           clientId: this.configService.get<string>('integrations.linkedin.clientId'), // Example config
           clientSecret: this.configService.get<string>('integrations.linkedin.clientSecret'), // Example config
       }));


      this.logger.info('Default integrations registration attempt finished.', {
        registeredCount: this.integrations.size
      });
    } catch (error) {
      this.logger.error('Failed to register default integrations', {
        error: error.message,
        stack: error.stack
      });
      // Decide if this should halt application startup
      // throw error;
    }
  }

  /**
   * Register a new integration instance
   */
  registerIntegration(integration: Integration): void {
    if (!integration || !integration.id) {
      this.logger.error('Attempted to register an invalid integration (missing id).', { integration });
      throw new Error('Integration must have an id property');
    }

    if (this.integrations.has(integration.id)) {
       this.logger.warn(`Integration with ID "${integration.id}" is already registered. Overwriting.`, {
         integrationId: integration.id,
         type: integration.type
       });
    } else {
       this.logger.info('Integration registered', {
         integrationId: integration.id,
         type: integration.type
       });
    }
    this.integrations.set(integration.id, integration);
  }

  /**
   * Unregister an integration
   */
  unregisterIntegration(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    if (integration && integration.isConnected) {
        this.logger.warn(`Unregistering integration "${integrationId}" while it is still connected. Consider disconnecting first.`);
        // Optionally force disconnect: await this.disconnectIntegration(integrationId);
    }
    const result = this.integrations.delete(integrationId);

    if (result) {
      this.logger.info('Integration unregistered', { integrationId });
    } else {
      this.logger.warn('Failed to unregister integration - not found', { integrationId });
    }

    return result;
  }

  /**
   * Get an integration instance by ID
   */
  getIntegration(integrationId: string): Integration | undefined { // Return type includes undefined
    const integration = this.integrations.get(integrationId);
     if (!integration) {
        this.logger.warn(`Integration with ID "${integrationId}" not found.`);
     }
    return integration;
  }

  /**
   * List all registered integrations (return basic info, not full instances potentially)
   */
  listIntegrations(): Partial<Integration>[] { // Return partial info for listing
    return Array.from(this.integrations.values()).map(int => ({
        id: int.id,
        name: int.name,
        type: int.type,
        description: int.description,
        isConnected: int.isConnected,
        isEnabled: int.isEnabled,
        logoUrl: int.config.logoUrl, // Include logo URL if available in config
    }));
  }

  /**
   * List integrations by type
   */
  listIntegrationsByType(type: IntegrationType): Partial<Integration>[] {
    return this.listIntegrations().filter(integration => integration.type === type);
  }

  /**
   * Check if an integration exists
   */
  hasIntegration(integrationId: string): boolean {
    return this.integrations.has(integrationId);
  }

  /**
   * Connect to an integration with secure credential handling
   */
  async connectIntegration(integrationId: string, credentials?: Record<string, any>): Promise<boolean> {
    const integration = this.getIntegration(integrationId);

    if (!integration) {
      this.logger.error(`Connect failed: Integration not found: ${integrationId}`);
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
      // Store credentials securely if provided
      if (credentials) {
        await this.credentialVault.storeCredentials(integrationId, credentials);
      }

      // Retrieve stored credentials if they exist
      const storedCredentials = await this.credentialVault.getCredentials(integrationId);
      
      if (storedCredentials) {
        // Apply credentials based on auth type
        switch (integration.config.authType) {
          case AuthType.API_KEY:
            Object.assign(integration.config, { apiKey: storedCredentials.apiKey });
            break;
          case AuthType.OAUTH2:
            Object.assign(integration.config, {
              accessToken: storedCredentials.accessToken,
              refreshToken: storedCredentials.refreshToken
            });
            break;
          case AuthType.OAUTH1:
            Object.assign(integration.config, {
              oauthToken: storedCredentials.oauthToken,
              oauthTokenSecret: storedCredentials.oauthTokenSecret
            });
            break;
          case AuthType.BASIC:
            Object.assign(integration.config, {
              username: storedCredentials.username,
              password: storedCredentials.password
            });
            break;
        }
      }

      const result = await integration.connect();
      if (result) {
        this.logger.info('Integration connected successfully', { integrationId });
      }
      return result;
    } catch (error) {
      this.logger.error('Failed to connect integration', {
        integrationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Disconnect from an integration
   */
  async disconnectIntegration(integrationId: string): Promise<boolean> {
    const integration = this.getIntegration(integrationId);

    if (!integration) {
       this.logger.error(`Disconnect failed: Integration not found: ${integrationId}`);
      throw new Error(`Integration not found: ${integrationId}`);
    }

     if (!integration.isConnected) {
        this.logger.warn(`Integration ${integrationId} is already disconnected.`);
        return true; // Already disconnected
    }

    try {
      const result = await integration.disconnect();
       if (result) {
         this.logger.info('Integration disconnected successfully', { integrationId });
       } else {
          this.logger.warn('Integration disconnect() returned false without throwing error.', { integrationId });
       }
      return result;
    } catch (error) {
      this.logger.error('Failed to disconnect integration', {
        integrationId,
        error: error.message,
        // stack: error.stack
      });
      throw error; // Re-throw
    }
  }

  /**
   * Execute an action on an integration
   */
  async executeIntegrationAction(integrationId: string, action: string, params: Record<string, any> = {}): Promise<any> {
    const integration = this.getIntegration(integrationId);

    if (!integration) {
       this.logger.error(`Execute failed: Integration not found: ${integrationId}`);
      throw new Error(`Integration not found: ${integrationId}`);
    }

    // Allow 'connect' action even if not connected
    if (!integration.isConnected && action !== 'connect') {
       this.logger.error(`Execute failed: Integration ${integrationId} is not connected. Action: ${action}`);
      throw new Error(`Integration ${integrationId} is not connected. Call connect() first or execute the 'connect' action.`);
    }

    // Check if the action is supported by the integration's capabilities
    if (!integration.capabilities?.actions?.includes(action)) {
        this.logger.error(`Execute failed: Action "${action}" not supported by integration ${integrationId}.`);
        throw new Error(`Action "${action}" is not supported by integration ${integrationId}. Supported actions: ${integration.capabilities?.actions?.join(', ')}`);
    }


    try {
      const startTime = Date.now();
      this.logger.info(`Executing action "${action}" on integration ${integrationId}...`, { params: Object.keys(params) }); // Log param keys, not values
      const result = await integration.execute(action, params);
      const duration = Date.now() - startTime;

      this.logger.info('Integration action executed successfully', {
        integrationId,
        action,
        durationMs: duration,
        // resultSummary: typeof result === 'object' ? Object.keys(result) : typeof result // Avoid logging potentially large results
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to execute integration action', {
        integrationId,
        action,
        error: error.message,
        // stack: error.stack
      });
      throw error; // Re-throw
    }
  }

  /**
   * Get integration metadata
   */
  async getIntegrationMetadata(integrationId: string): Promise<Record<string, any>> {
    const integration = this.getIntegration(integrationId);

    if (!integration) {
       this.logger.error(`Get metadata failed: Integration not found: ${integrationId}`);
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
       // Check if getMetadata method exists on the integration instance
       if (typeof integration.getMetadata === 'function') {
         return await integration.getMetadata();
       } else {
          // Fallback to basic info if getMetadata is not implemented
          this.logger.warn(`Integration ${integrationId} does not have a getMetadata method. Returning basic info.`);
          return {
             id: integration.id,
             name: integration.name,
             type: integration.type,
             description: integration.description,
             isConnected: integration.isConnected,
             isEnabled: integration.isEnabled,
             capabilities: integration.capabilities,
          };
       }
    } catch (error) {
      this.logger.error('Failed to get integration metadata', {
        integrationId,
        error: error.message,
        // stack: error.stack
      });
      throw error; // Re-throw
    }
  }

  /**
   * Get all integrations metadata
   */
  async getAllIntegrationsMetadata(): Promise<Record<string, any>[]> {
    const results: Record<string, any>[] = [];
    const integrationIds = Array.from(this.integrations.keys());

    this.logger.info(`Fetching metadata for ${integrationIds.length} integrations.`);

    for (const integrationId of integrationIds) {
      try {
        const metadata = await this.getIntegrationMetadata(integrationId);
        results.push(metadata);
      } catch (error) {
        // Log error but continue fetching metadata for other integrations
        this.logger.error(`Failed to get metadata for integration ${integrationId}, skipping.`, {
           error: error.message
        });
        // Optionally push partial/error metadata: results.push({ id: integrationId, error: 'Failed to fetch metadata' });
      }
    }

    this.logger.info(`Successfully fetched metadata for ${results.length} integrations.`);
    return results;
  }
}