import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { Logger } from '@nestjs/common';
// import { claudeCodeCLIAdapter } from '../types/core';
// import { geminiCLIAdapter } from '../types/core';

export interface LLMRegistry {
  registerProvider(id: string, config: any): Promise<void>;
  unregisterProvider(id: string): Promise<void>;
}

class MockLLMRegistry implements LLMRegistry {
  async registerProvider(id: string, config: any): Promise<void> {
    // Mock implementation
  }
  
  async unregisterProvider(id: string): Promise<void> {
    // Mock implementation
  }
}

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
    private readonly prisma: PrismaService
  ) {}

  async findAll(): Promise<LLMProviderDTO[]> {
    try {
      // Get providers from database
      const providers = await this.prisma.lLMConfig.findMany({
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
      const newProvider = await this.prisma.lLMConfig.create({
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
      const provider = await this.prisma.lLMConfig.findUnique({
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
      const provider = await this.prisma.lLMConfig.update({
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
      const provider = await this.prisma.lLMConfig.findUnique({
        where: { id }
      });

      if (!provider || !provider.isCustom) {
        throw new Error('Only custom providers can be deleted');
      }

      // Remove from LLM registry
      await this.llmRegistry.unregisterProvider(id);

      // Delete from database
      await this.prisma.lLMConfig.delete({
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
      await this.prisma.lLMConfig.updateMany({
        data: {
          priority: 10
        }
      });

      // Set the selected provider as default
      const provider = await this.prisma.lLMConfig.update({
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

  async registerClaudeCodeCLI(): Promise<LLMProviderDTO | null> {
    try {
      // Check if Claude Code CLI is available
      const isAvailable = true; // Mock implementation
      
      if (!isAvailable) {
        this.logger.warn('Claude Code CLI is not available on this system');
        return null;
      }

      // Check if already registered
      const existingProvider = await this.prisma.lLMConfig.findFirst({
        where: { 
          provider: 'local',
          name: 'Claude Code CLI'
        }
      });

      if (existingProvider) {
        this.logger.log('Claude Code CLI provider already registered');
        return {
          id: existingProvider.id,
          name: existingProvider.name,
          provider: existingProvider.provider,
          modelName: existingProvider.modelName,
          isDefault: existingProvider.priority === 1,
          isCustom: false,
          apiEndpoint: existingProvider.apiEndpoint
        };
      }

      // Register new provider
      const newProvider = await this.prisma.lLMConfig.create({
        data: {
          name: 'Claude Code CLI',
          provider: 'local',
          modelName: 'claude-sonnet-4',
          apiKey: 'local://claude-code-cli', // Special identifier
          apiEndpoint: 'local://claude-code-cli',
          isCustom: false,
          enabled: true,
          priority: 5, // Medium priority
          retryConfig: {
            maxAttempts: 2,
            initialDelay: 1000,
            maxDelay: 5000,
            backoffFactor: 2
          }
        }
      });

      // Register with LLM registry
      await this.llmRegistry.registerProvider(newProvider.id, {
        provider: newProvider.provider,
        model: newProvider.modelName,
        apiKey: newProvider.apiKey,
        apiEndpoint: newProvider.apiEndpoint,
        enabled: true,
        priority: newProvider.priority,
        modelName: newProvider.modelName
      });

      this.logger.log('Claude Code CLI provider registered successfully');

      return {
        id: newProvider.id,
        name: newProvider.name,
        provider: newProvider.provider,
        modelName: newProvider.modelName,
        isDefault: false,
        isCustom: false,
        apiEndpoint: newProvider.apiEndpoint
      };
    } catch (error) {
      this.logger.error('Failed to register Claude Code CLI provider', error);
      throw error;
    }
  }

  async registerGeminiCLI(): Promise<LLMProviderDTO | null> {
    try {
      // Check if Gemini CLI is available
      const isAvailable = true; // Mock implementation
      
      if (!isAvailable) {
        this.logger.warn('Gemini CLI is not available on this system');
        return null;
      }

      // Check if already registered
      const existingProvider = await this.prisma.lLMConfig.findFirst({
        where: { 
          provider: 'local',
          name: 'Gemini CLI'
        }
      });

      if (existingProvider) {
        this.logger.log('Gemini CLI provider already registered');
        return {
          id: existingProvider.id,
          name: existingProvider.name,
          provider: existingProvider.provider,
          modelName: existingProvider.modelName,
          isDefault: existingProvider.priority === 1,
          isCustom: false,
          apiEndpoint: existingProvider.apiEndpoint
        };
      }

      // Register new provider
      const newProvider = await this.prisma.lLMConfig.create({
        data: {
          name: 'Gemini CLI',
          provider: 'local',
          modelName: 'gemini-pro',
          apiKey: 'local://gemini-cli', // Special identifier
          apiEndpoint: 'local://gemini-cli',
          isCustom: false,
          enabled: true,
          priority: 5, // Medium priority
          retryConfig: {
            maxAttempts: 2,
            initialDelay: 1000,
            maxDelay: 5000,
            backoffFactor: 2
          }
        }
      });

      // Register with LLM registry
      await this.llmRegistry.registerProvider(newProvider.id, {
        provider: newProvider.provider,
        model: newProvider.modelName,
        apiKey: newProvider.apiKey,
        apiEndpoint: newProvider.apiEndpoint,
        enabled: true,
        priority: newProvider.priority,
        modelName: newProvider.modelName
      });

      this.logger.log('Gemini CLI provider registered successfully');

      return {
        id: newProvider.id,
        name: newProvider.name,
        provider: newProvider.provider,
        modelName: newProvider.modelName,
        isDefault: false,
        isCustom: false,
        apiEndpoint: newProvider.apiEndpoint
      };
    } catch (error) {
      this.logger.error('Failed to register Gemini CLI provider', error);
      throw error;
    }
  }
}