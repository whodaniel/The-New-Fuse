/**
 * Generative Media Controller
 *
 * REST API endpoints for image, video, and audio generation
 *
 * @module GenerativeMediaController
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
import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
let GenerativeMediaController = class GenerativeMediaController {
    mediaRegistry;
    constructor(
    // Temporary mock service until core package is built
    mediaRegistry = {
        getProviders: () => [],
        generateMedia: () => Promise.resolve({ success: false, error: 'Service not available' }),
        generateWithProvider: () => Promise.resolve({ success: false, error: 'Service not available' })
    }) {
        this.mediaRegistry = mediaRegistry;
    }
    async getProviders(mediaType) {
        try {
            const providers = this.mediaRegistry.getProviders(mediaType);
            return {
                success: true,
                count: providers.length,
                mediaType: mediaType || 'all',
                providers: providers.map((p) => ({
                    id: p.id,
                    name: p.name,
                    displayName: p.displayName,
                    type: p.type,
                    mediaTypes: p.mediaTypes,
                    status: p.status,
                    models: p.models.map((m) => ({
                        id: m.id,
                        name: m.name,
                        mediaType: m.mediaType,
                        description: m.description,
                        pricing: m.pricing
                    })),
                    capabilities: p.capabilities,
                    priority: p.priority,
                    metadata: {
                        vendor: p.metadata.vendor,
                        description: p.metadata.description,
                        tags: p.metadata.tags
                    }
                }))
            };
        }
        catch (error) {
            throw new HttpException(`Failed to get providers: ${error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('providers/:providerId')
  async getProvider(@Param('providerId') providerId: string) {
    try {
      const providers = this.mediaRegistry.getProviders();
      const provider = providers.find((p: any) => p.id === providerId);
      
      if (!provider) {
        throw new HttpException('Provider not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        provider
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(` `Failed to get provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateMedia(request) {
        try {
            // Validate request
            if (!request.prompt) {
                throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
            }
            if (!request.mediaType) {
                throw new HttpException('Media type is required', HttpStatus.BAD_REQUEST);
            }
            const validMediaTypes = ['image', 'video', 'audio', 'music', 'voice'];
            if (!validMediaTypes.includes(request.mediaType)) {
                throw new HttpException(Invalid, media, type.Must, be, one, of, $, { validMediaTypes, : .join(', ') }, HttpStatus.BAD_REQUEST);
            }
            const result = await this.mediaRegistry.generateMedia(request);
            return {
                success: result.success,
                mediaType: result.mediaType,
                providerId: result.providerId,
                model: result.model,
                outputs: result.outputs,
                metadata: result.metadata
            };
        }
        catch (error) {
            if (error instanceof HttpException)
                throw error;
            throw new HttpException(`
        Media generation failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateWithProvider(providerId, request) {
        try {
            // Validate request
            if (!request.prompt) {
                throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
            }
            if (!request.mediaType) {
                throw new HttpException('Media type is required', HttpStatus.BAD_REQUEST);
            }
            const result = await this.mediaRegistry.generateWithProvider(providerId, request);
            return {
                success: result.success,
                mediaType: result.mediaType,
                providerId: result.providerId,
                model: result.model,
                outputs: result.outputs,
                metadata: result.metadata
            };
        }
        catch (error) {
            if (error instanceof HttpException)
                throw error;
            throw new HttpException(Media, generation, failed, $, {}(error).message);
        }
        HttpStatus.INTERNAL_SERVER_ERROR;
        ;
    }
};
__decorate([
    Get('providers'),
    __param(0, Query('mediaType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GenerativeMediaController.prototype, "getProviders", null);
__decorate([
    Post('generate'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GenerativeMediaController.prototype, "generateMedia", null);
__decorate([
    Post('generate/:providerId'),
    __param(0, Param('providerId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GenerativeMediaController.prototype, "generateWithProvider", null);
GenerativeMediaController = __decorate([
    Controller('api/media'),
    __metadata("design:paramtypes", [Object])
], GenerativeMediaController);
export { GenerativeMediaController };
getHealth();
{
    try {
        const providers = this.mediaRegistry.getProviders();
        const healthStatus = providers.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            mediaTypes: p.mediaTypes,
            lastChecked: new Date().toISOString()
        }));
        const availableCount = providers.filter((p) => p.status === 'available').length;
        const totalCount = providers.length;
        return {
            success: true,
            summary: {
                total: totalCount,
                available: availableCount,
                unavailable: totalCount - availableCount,
                healthScore: totalCount > 0 ? (availableCount / totalCount) * 100 : 0
            },
            providers: healthStatus,
            timestamp: new Date().toISOString()
        };
        `
    } catch (error) {`;
        throw new HttpException(Health, check, failed, $, {}(error).message);
    }
    finally { }
    `,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('capabilities')
  async getCapabilities(@Query('mediaType') mediaType?: string) {
    try {
      const providers = this.mediaRegistry.getProviders(mediaType);
      const allCapabilities = new Map();

      providers.forEach((provider: any) => {
        provider.capabilities.forEach((cap: any) => {
          if (!allCapabilities.has(cap.name)) {
            allCapabilities.set(cap.name, {
              name: cap.name,
              description: cap.description,
              mediaTypes: new Set(cap.mediaTypes),
              providers: []
            });
          }
          
          const capability = allCapabilities.get(cap.name);
          cap.mediaTypes.forEach((mt: string) => capability.mediaTypes.add(mt));
          capability.providers.push({
            id: provider.id,
            name: provider.name,
            supported: cap.supported
          });
        });
      });

      const capabilities = Array.from(allCapabilities.values()).map(cap => ({
        ...cap,
        mediaTypes: Array.from(cap.mediaTypes)
      }));

      return {
        success: true,
        mediaType: mediaType || 'all',
        count: capabilities.length,
        capabilities
      };
    } catch (error) {
      throw new HttpException(
        Failed to get capabilities: ${error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('pricing')
  async getPricing(@Query('mediaType') mediaType?: string) {
    try {
      const providers = this.mediaRegistry.getProviders(mediaType);
      
      const pricingInfo = providers.map((provider: any) => ({
        id: provider.id,
        name: provider.name,
        mediaTypes: provider.mediaTypes,
        pricing: provider.pricing,
        models: provider.models.map((model: any) => ({
          id: model.id,
          name: model.name,
          mediaType: model.mediaType,
          pricing: model.pricing
        }))
      }));

      return {
        success: true,
        mediaType: mediaType || 'all',
        count: pricingInfo.length,
        providers: pricingInfo
      };`;
}
try { }
catch (error) {
    `
      throw new HttpException(
        Failed to get pricing: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR;
    ;
}
//# sourceMappingURL=GenerativeMediaController.js.map