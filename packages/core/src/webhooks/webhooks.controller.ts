import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookManagerService, WebhookConfig } from './webhook-manager.service.js';

export interface CreateWebhookDto {
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  active?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export interface UpdateWebhookDto {
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  secret?: string;
  active?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhookManager: WebhookManagerService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully' })
  async registerWebhook(@Body() webhookData: CreateWebhookDto): Promise<WebhookConfig> {
    try {
      const config = {
        url: webhookData.url,
        events: webhookData.events,
        headers: webhookData.headers || {},
        secret: webhookData.secret,
        active: webhookData.active ?? true,
        retryAttempts: webhookData.retryAttempts ?? 3,
        timeout: webhookData.timeout ?? 5000,
      };
      return await this.webhookManager.registerWebhook(config);
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to register webhook',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async getAllWebhooks(): Promise<WebhookConfig[]> {
    try {
      return await this.webhookManager.getAllWebhooks();
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get webhooks',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific webhook' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  async getWebhook(@Param('id') id: string): Promise<WebhookConfig> {
    try {
      const webhook = await this.webhookManager.getWebhook(id);
      if (!webhook) {
        throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
      }
      return webhook;
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get webhook',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  async updateWebhook(
    @Param('id') id: string,
    @Body() updates: UpdateWebhookDto
  ): Promise<WebhookConfig> {
    try {
      const webhook = await this.webhookManager.updateWebhook(id, updates);
      if (!webhook) {
        throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
      }
      return webhook;
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to update webhook',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  async deleteWebhook(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      const deleted = await this.webhookManager.unregisterWebhook(id);
      if (!deleted) {
        throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
      }
      return { success: true };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to delete webhook',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger webhooks for an event' })
  @ApiResponse({ status: 200, description: 'Webhooks triggered successfully' })
  async triggerWebhooks(
    @Body() eventData: { type: string; data: any }
  ): Promise<{ success: boolean }> {
    try {
      await this.webhookManager.triggerWebhook(eventData.type, eventData.data);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to trigger webhooks',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get events for a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook events retrieved successfully' })
  async getWebhookEvents(@Param('id') id: string): Promise<any[]> {
    try {
      return await this.webhookManager.getWebhookEvents(id);
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get webhook events',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('retry-failed')
  @ApiOperation({ summary: 'Retry failed webhook deliveries' })
  @ApiResponse({ status: 200, description: 'Failed webhooks retried successfully' })
  async retryFailedWebhooks(): Promise<{ success: boolean }> {
    try {
      await this.webhookManager.retryFailedWebhooks();
      return { success: true };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to retry webhooks',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}