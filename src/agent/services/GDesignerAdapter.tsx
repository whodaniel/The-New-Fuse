import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DesignConfig, DesignPayload, DesignResult } from '../../types/design.types.js';
import { RetryService } from './RetryService.js';

interface RendererOptions {
  format: 'svg' | 'png' | 'json';
  scale?: number;
  quality?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class GDesignerAdapter {
  private readonly logger = new Logger(GDesignerAdapter.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly retryService: RetryService
  ) {}

  async renderDesign(
    payload: DesignPayload,
    config: DesignConfig,
    options: RendererOptions
  ): Promise<DesignResult> {
    this.logger.debug(`Rendering design: ${JSON.stringify(payload)}`);

    try {
      const result = await this.retryService.retry(
        () => this.executeRender(payload, config, options),
        {
          maxAttempts: 3,
          retryableErrors: ['RENDERER_BUSY', 'TEMPORARY_FAILURE']
        }
      );

      this.eventEmitter.emit('design.rendered', {
        designId: payload.id,
        status: 'success',
        result
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Design rendering failed: ${errorMessage}`);

      this.eventEmitter.emit('design.error', {
        designId: payload.id,
        error: errorMessage,
        payload,
        config
      });

      throw error;
    }
  }

  private async executeRender(
    payload: DesignPayload,
    config: DesignConfig,
    options: RendererOptions
  ): Promise<DesignResult> {
    await this.validatePayload(payload);
    await this.validateConfig(config);

    // Here you would implement the actual rendering logic
    // This is just a placeholder implementation
    return {
      id: payload.id,
      format: options.format,
      url: `https://design-cdn.example.com/${payload.id}.${options.format}`,
      metadata: {
        createdAt: new Date().toISOString(),
        dimensions: payload.dimensions,
        ...options.metadata
      }
    };
  }

  private async validatePayload(payload: DesignPayload): Promise<void> {
    if (!payload.id || !payload.content) {
      throw new Error('Invalid design payload: missing required fields');
    }

    if (!payload.dimensions || !payload.dimensions.width || !payload.dimensions.height) {
      throw new Error('Invalid design payload: missing or invalid dimensions');
    }
  }

  private async validateConfig(config: DesignConfig): Promise<void> {
    if (!config.template) {
      throw new Error('Invalid design config: template is required');
    }

    if (!config.version) {
      throw new Error('Invalid design config: version is required');
    }
  }
}