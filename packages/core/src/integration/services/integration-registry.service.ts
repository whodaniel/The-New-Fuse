import { Injectable, Logger } from '@nestjs/common';

export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'deprecated';
  category: string;
  tags: string[];
}

@Injectable()
export class IntegrationRegistryService {
  private readonly logger = new Logger(IntegrationRegistryService.name);
  private readonly integrations = new Map<string, IntegrationMetadata>();

  registerIntegration(metadata: IntegrationMetadata): void {
    this.integrations.set(metadata.id, metadata);
    this.logger.log(`Registered integration: ${metadata.name} (${metadata.id})`);
  }

  unregisterIntegration(id: string): boolean {
    const removed = this.integrations.delete(id);
    if (removed) {
      this.logger.log(`Unregistered integration: ${id}`);
    }
    return removed;
  }

  getIntegration(id: string): IntegrationMetadata | undefined {
    return this.integrations.get(id);
  }

  listIntegrations(): IntegrationMetadata[] {
    return Array.from(this.integrations.values());
  }

  findIntegrationsByCategory(category: string): IntegrationMetadata[] {
    return this.listIntegrations().filter((integration) => integration.category === category);
  }

  findIntegrationsByTag(tag: string): IntegrationMetadata[] {
    return this.listIntegrations().filter((integration) => integration.tags.includes(tag));
  }
}
