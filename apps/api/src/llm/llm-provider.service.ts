import { Injectable } from '@nestjs/common';
import { LLMRegistry } from '@/llm/LLMRegistry';
import { DatabaseService } from '@/services/database';
import { Logger } from '@/utils/logger';

export interface LLMProviderDTO {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  isDefault?: boolean;
  isCustom?: boolean;
  apiEndpoint?: string;
}

export interface CreateLLMProviderDTO {
  name: string;
  provider: string;
  modelName: string;
  apiKey: string;
  apiEndpoint?: string;
}

@Injectable()
export class LLMProviderService {
  private logger = new Logger('LLMProviderService');

  constructor(
    private readonly llmRegistry: LLMRegistry,
    private readonly db: DatabaseService
  ) {}

  async findAll(): Promise<LLMProviderDTO[]> {
    try {
      // Get providers from database
      const providers = await this.db.llmConfigs.findMany({
        where: { enabled: true },
        orderBy: { priority: 'desc' },
        select: {
          id: true,
          name: true,
          provider: true,
          modelName: true,
          priority: true,
          apiEndpoint: true,
          isCustom: true
        }
      });

      return providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        modelName: provider.modelName,
        isDefault: provider.priority === 1,
        isCustom: provider.isCustom || false,
        apiEndpoint: provider.apiEndpoint
      }));
    } catch (error) {
      this.logger.error('Failed to fetch LLM providers', error);
      throw error;
    }
  }

  async create(dto: CreateLLMProviderDTO): Promise<LLMProviderDTO> {
    try {
      // Create new provider configuration in database
      const newProvider = await this.db.llmConfigs.create({
        data: {
          name: dto.name,
          provider: dto.provider,
          modelName: dto.modelName,
          apiKey: dto.apiKey, // Encrypt in actual implementation
          apiEndpoint: dto.apiEndpoint,
          isCustom: true,
          enabled: true,
          priority: 10, // Lower priority than default providers
          retryConfig: {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2
          }
        }
      });

      // Register the provider with the LLM registry
      await this.llmRegistry.registerProvider(newProvider.id, {
        provider: newProvider.provider,
        model: newProvider.modelName,
        apiKey: newProvider.apiKey,
        apiEndpoint: newProvider.apiEndpoint,
        enabled: true,
        priority: newProvider.priority,
        modelName: newProvider.modelName
      });

      return {
        id: newProvider.id,
        name: newProvider.name,
        provider: newProvider.provider,
        modelName: newProvider.modelName,
        isCustom: true,
        apiEndpoint: newProvider.apiEndpoint
      };
    } catch (error) {
      this.logger.error('Failed to create LLM provider', error);
      throw error;
    }
  }

  async findById(id: string): Promise<LLMProviderDTO> {
    try {
      const provider = await this.db.llmConfigs.findUnique({
        where: { id }
      });

      if (!provider) {
        throw new Error(`Provider with id ${id} not found`);
      }

      return {
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        modelName: provider.modelName,
        isDefault: provider.priority === 1,
        isCustom: provider.isCustom || false,
        apiEndpoint: provider.apiEndpoint
      };
    } catch (error) {
      this.logger.error(`Failed to find LLM provider with id ${id}`, error);
      throw error;
    }
  }

  async update(id: string, dto: Partial<CreateLLMProviderDTO>): Promise<LLMProviderDTO> {
    try {
      const provider = await this.db.llmConfigs.update({
        where: { id },
        data: {
          name: dto.name,
          provider: dto.provider,
          modelName: dto.modelName,
          apiKey: dto.apiKey, // Encrypt in actual implementation
          apiEndpoint: dto.apiEndpoint
        }
      });

      // Re-register the provider with updated config
      await this.llmRegistry.unregisterProvider(id);
      await this.llmRegistry.registerProvider(id, {
        provider: provider.provider,
        model: provider.modelName,
        apiKey: provider.apiKey,
        apiEndpoint: provider.apiEndpoint,
        enabled: provider.enabled,
        priority: provider.priority,
        modelName: provider.modelName
      });

      return {
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        modelName: provider.modelName,
        isDefault: provider.priority === 1,
        isCustom: provider.isCustom || false,
        apiEndpoint: provider.apiEndpoint
      };
    } catch (error) {
      this.logger.error(`Failed to update LLM provider with id ${id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Check if it's a custom provider
      const provider = await this.db.llmConfigs.findUnique({
        where: { id }
      });

      if (!provider || !provider.isCustom) {
        throw new Error('Only custom providers can be deleted');
      }

      // Remove from LLM registry
      await this.llmRegistry.unregisterProvider(id);

      // Delete from database
      await this.db.llmConfigs.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete LLM provider with id ${id}`, error);
      throw error;
    }
  }

  async setDefault(id: string): Promise<LLMProviderDTO> {
    try {
      // Reset all providers to non-default
      await this.db.llmConfigs.updateMany({
        data: {
          priority: 10
        }
      });

      // Set the selected provider as default
      const provider = await this.db.llmConfigs.update({
        where: { id },
        data: {
          priority: 1
        }
      });

      return {
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        modelName: provider.modelName,
        isDefault: true,
        isCustom: provider.isCustom || false,
        apiEndpoint: provider.apiEndpoint
      };
    } catch (error) {
      this.logger.error(`Failed to set LLM provider ${id} as default`, error);
      throw error;
    }
  }
}