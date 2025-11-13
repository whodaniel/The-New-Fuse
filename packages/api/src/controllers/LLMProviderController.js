/**
 * LLM Provider Controller
 *
 * REST API endpoints for managing and accessing LLM providers through the unified registry.
 * Provides endpoints for provider discovery, configuration, and execution.
 *
 * @module LLMProviderController
 * @since 2025-10-06
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LLMProviderController_1;
import { Controller, Get, Post, Put, Body, Param, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
// Mock enums for build compatibility
const LLMProviderType = {
    CLI_AGENT: 'cli_agent',
    API_DIRECT: 'api_direct',
    LITELLM_PROXY: 'litellm_proxy'
};
const LLMProviderStatus = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    CHECKING: 'checking'
};
export class LLMProviderQueryDto {
    type;
    status;
    capability;
    tags;
    category;
}
export class LLMExecutionRequestDto {
    prompt;
    providerId;
    model;
    temperature;
    maxTokens;
    systemPrompt;
    timeout;
    retryOnFailure;
    fallbackProviders;
    preferredType;
    requiredCapability;
}
export class LLMProviderConfigDto {
    id;
    name;
    displayName;
    type;
    status;
    endpoint;
    apiKey;
    command;
    defaultModel;
    availableModels;
    capabilities;
    priority;
    metadata;
}
let LLMProviderController = LLMProviderController_1 = class LLMProviderController {
    providerRegistry;
    liteLLMService;
    logger = new Logger(LLMProviderController_1.name);
    constructor(
    // Temporary mock services until core package is built
    providerRegistry = {
        getProviders: () => [],
        executeWithProvider: () => Promise.resolve({ success: false, error: 'Service not available' }),
        executeWithBestProvider: () => Promise.resolve({ success: false, error: 'Service not available' })
    }, liteLLMService = {
        getAvailableProviders: () => [],
        getProviderDefinition: () => null
    }) {
        this.providerRegistry = providerRegistry;
        this.liteLLMService = liteLLMService;
    }
    async getProviders(query) {
        try {
            const filters = {};
            if (query.type)
                filters.type = query.type;
            if (query.status)
                filters.status = query.status;
            if (query.capability)
                filters.capability = query.capability;
            if (query.tags)
                filters.tags = Array.isArray(query.tags) ? query.tags : [query.tags];
            const providers = this.providerRegistry.getProviders(filters);
            // Filter by category if specified
            if (query.category) {
                return providers.filter((p) => p.metadata.tags.includes(query.category));
            }
            return providers;
        }
        catch (error) {
            this.logger.error('Failed to get providers:', error);
            throw new HttpException('Failed to retrieve providers', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProvider(id) {
        try {
            const provider = this.providerRegistry.getProvider(id);
            if (!provider) {
                throw new HttpException('Provider not found', HttpStatus.NOT_FOUND);
            }
            return provider;
        }
        catch (error) {
            if (error instanceof HttpException)
                throw error;
            this.logger.error(`Failed to get provider ${id}:, error);
      throw new HttpException('Failed to retrieve provider', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('providers')
  async registerProvider(@Body() config: LLMProviderConfigDto): Promise<{ message: string; providerId: string }> {
    try {
      await this.providerRegistry.registerProvider(config as any);
      
      return {
        message: 'Provider registered successfully',
        providerId: config.id
      };
    } catch (error) {
      this.logger.error('Failed to register provider:', error);
      throw new HttpException(` `Failed to register provider: ${error.message}`, HttpStatus.BAD_REQUEST);
        }
    }
    async updateProviderStatus(id, body) {
        try {
            await this.providerRegistry.updateProviderStatus(id, body.status, body.error);
            return { message: 'Provider status updated successfully' };
        }
        catch (error) {
            this.logger.error(Failed, to, update, provider, $, { id }, status, error);
            throw new HttpException('Failed to update provider status', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async executeRequest(request) {
        try {
            if (!request.prompt) {
                throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
            }
            let result;
            if (request.providerId) {
                // Execute with specific provider
                const context = {
                    providerId: request.providerId,
                    model: request.model,
                    temperature: request.temperature,
                    maxTokens: request.maxTokens,
                    systemPrompt: request.systemPrompt,
                    timeout: request.timeout,
                    retryOnFailure: request.retryOnFailure,
                    fallbackProviders: request.fallbackProviders
                };
                result = await this.providerRegistry.executeWithProvider(request.providerId, request.prompt, context);
            }
            else {
                // Execute with best available provider
                const context = {
                    model: request.model,
                    temperature: request.temperature,
                    maxTokens: request.maxTokens,
                    systemPrompt: request.systemPrompt,
                    timeout: request.timeout,
                    retryOnFailure: request.retryOnFailure,
                    preferredType: request.preferredType,
                    requiredCapability: request.requiredCapability
                };
                result = await this.providerRegistry.executeWithBestProvider(request.prompt, context);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Failed to execute LLM request:', error);
            if (error.message.includes('No available providers')) {
                throw new HttpException('No available providers found', HttpStatus.SERVICE_UNAVAILABLE);
            }
            throw new HttpException(`
        Failed to execute request: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async executeWithProvider(providerId, request) {
        try {
            const context = {
                providerId,
                model: request.model,
                temperature: request.temperature,
                maxTokens: request.maxTokens,
                systemPrompt: request.systemPrompt,
                timeout: request.timeout,
                retryOnFailure: request.retryOnFailure,
                fallbackProviders: request.fallbackProviders
            };
            return await this.providerRegistry.executeWithProvider(providerId, request.prompt, context);
        }
        catch (error) {
            this.logger.error(Failed, to, execute);
            with (provider)
                $;
            {
                providerId;
            }
            error;
            ;
            `
      throw new HttpException(
        Failed to execute with provider: ${error.message}` `,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('litellm/providers')
  async getLiteLLMProviders(): Promise<LiteLLMProviderDefinition[]> {
    try {
      return this.liteLLMService.getSupportedProviders();
    } catch (error) {
      this.logger.error('Failed to get LiteLLM providers:', error);
      throw new HttpException('Failed to retrieve LiteLLM providers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('litellm/providers/major')
  async getMajorLiteLLMProviders(): Promise<LiteLLMProviderDefinition[]> {
    try {
      return this.liteLLMService.getMajorProviders();
    } catch (error) {
      this.logger.error('Failed to get major LiteLLM providers:', error);
      throw new HttpException('Failed to retrieve major providers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('litellm/models')
  async getLiteLLMModels(): Promise<string[]> {
    try {
      return await this.liteLLMService.getAvailableModels();
    } catch (error) {
      this.logger.error('Failed to get LiteLLM models:', error);
      throw new HttpException('Failed to retrieve models', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('litellm/test')
  async testLiteLLMConnection(): Promise<{ success: boolean; error?: string; models?: string[] }> {
    try {
      return await this.liteLLMService.testConnection();
    } catch (error) {
      this.logger.error('Failed to test LiteLLM connection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @Get('health')
  async getHealthStatus(): Promise<{
    totalProviders: number;
    availableProviders: number;
    unavailableProviders: number;
    providers: Array<{ id: string; name: string; status: string; lastCheck?: Date }>;
  }> {
    try {
      const allProviders = this.providerRegistry.getProviders();
      const availableProviders = allProviders.filter((p: any) => p.status === 'available');
      const unavailableProviders = allProviders.filter((p: any) => p.status !== 'available');

      return {
        totalProviders: allProviders.length,
        availableProviders: availableProviders.length,
        unavailableProviders: unavailableProviders.length,
        providers: allProviders.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          lastCheck: p.metadata.lastHealthCheck
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get health status:', error);
      throw new HttpException('Failed to retrieve health status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
            ;
        }
    }
};
__decorate([
    Get('providers'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LLMProviderQueryDto]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "getProviders", null);
__decorate([
    Get('providers/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "getProvider", null);
__decorate([
    Put('providers/:id/status'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "updateProviderStatus", null);
__decorate([
    Post('execute'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LLMExecutionRequestDto]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "executeRequest", null);
__decorate([
    Post('execute/:providerId'),
    __param(0, Param('providerId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "executeWithProvider", null);
LLMProviderController = LLMProviderController_1 = __decorate([
    Controller('api/llm'),
    __metadata("design:paramtypes", [Object, Object])
], LLMProviderController);
export { LLMProviderController };
//# sourceMappingURL=LLMProviderController.js.map