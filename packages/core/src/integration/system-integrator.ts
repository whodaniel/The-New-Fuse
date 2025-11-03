import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Integration {
  id: string;
  name: string;
  isEnabled: boolean;
  config: Record<string, any>;
  initialize(): Promise<void>;
  healthCheck(): Promise<{ status: 'ok' | 'error'; details?: any }>;
  execute(action: string, payload: any): Promise<any>;
}

@Injectable()
export class SystemIntegrator {
  private readonly logger = new Logger(SystemIntegrator.name);
  private readonly integrations = new Map<string, Integration>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async registerIntegration(integration: Integration): Promise<void> {
    if (this.integrations.has(integration.id)) {
      this.logger.warn(`Integration with ID '${integration.id}' is already registered.`);
      return;
    }

    this.logger.log(`Registering integration: ${integration.name} (ID: ${integration.id})`);
    try {
      if (integration.isEnabled) {
        await integration.initialize();
        this.integrations.set(integration.id, integration);
        this.logger.log(`Successfully initialized and registered integration: ${integration.name}`);
        this.eventEmitter.emit('integration.registered', { integrationId: integration.id });
      } else {
        this.logger.log(`Integration ${integration.name} is disabled and will not be initialized.`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize integration ${integration.name}`, error.stack);
      this.eventEmitter.emit('integration.registration.failed', { integrationId: integration.id, error });
    }
  }

  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  async executeAction(integrationId: string, action: string, payload: any): Promise<any> {
    const integration = this.getIntegration(integrationId);
    if (!integration || !integration.isEnabled) {
      const errorMessage = `Integration '${integrationId}' not found or is disabled.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.debug(`Executing action '${action}' on integration '${integrationId}'`);
    return integration.execute(action, payload);
  }

  async runHealthChecks(): Promise<Record<string, { status: 'ok' | 'error'; details?: any }>> {
    const healthStatus = {};
    for (const [id, integration] of this.integrations.entries()) {
      if (integration.isEnabled) {
        healthStatus[id] = await integration.healthCheck();
      }
    }
    return healthStatus;
  }
}
