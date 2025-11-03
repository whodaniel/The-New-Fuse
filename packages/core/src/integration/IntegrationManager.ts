import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SystemIntegrator, Integration } from './system-integrator';
import { BlockchainIntegration, BlockchainConfig } from './blockchain';
// Import other integration classes as they are created

@Injectable()
export class IntegrationManager implements OnModuleInit {
  private readonly logger = new Logger(IntegrationManager.name);

  constructor(private readonly systemIntegrator: SystemIntegrator) {}

  onModuleInit() {
    this.loadIntegrations();
  }

  private loadIntegrations(): void {
    this.logger.log('Loading all available integrations...');

    // In a real-world scenario, this configuration would come from a database or a config file.
    const integrationsToLoad: { id: string; name: string; type: string; enabled: boolean; config: any }[] = [
      {
        id: 'mainnet-blockchain',
        name: 'Mainnet Blockchain',
        type: 'blockchain',
        enabled: true,
        config: {
          providerUrl: process.env.MAINNET_PROVIDER_URL || 'https://mainnet.infura.io/v3/your-api-key',
          privateKey: process.env.SERVER_WALLET_PRIVATE_KEY,
        },
      },
      // Add other integrations here, e.g., from a database
    ];

    for (const integrationConfig of integrationsToLoad) {
      try {
        const integrationInstance = this.createIntegration(integrationConfig.type, integrationConfig.config);

        if (integrationInstance) {
          const integration: Integration = {
            id: integrationConfig.id,
            name: integrationConfig.name,
            isEnabled: integrationConfig.enabled,
            config: integrationConfig.config,
            initialize: async () => { /* Initialization is handled in constructor for now */ },
            healthCheck: () => integrationInstance.healthCheck(),
            execute: (action, payload) => this.executeIntegrationAction(integrationInstance, action, payload),
          };
          this.systemIntegrator.registerIntegration(integration);
        }
      } catch (error) {
        this.logger.error(`Failed to create integration of type '${integrationConfig.type}'`, error.stack);
      }
    }
  }

  private createIntegration(type: string, config: any): any {
    switch (type) {
      case 'blockchain':
        return new BlockchainIntegration(config as BlockchainConfig);
      // Add cases for other integration types here
      default:
        this.logger.warn(`Integration type '${type}' is not supported.`);
        return null;
    }
  }

  private async executeIntegrationAction(instance: any, action: string, payload: any): Promise<any> {
    if (typeof instance[action] === 'function') {
      return instance[action](payload);
    } else {
      throw new Error(`Action '${action}' is not implemented on the integration.`);
    }
  }
}
