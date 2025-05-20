import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { WebhookManager } from './webhook-manager.service.js';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhookManager: WebhookManager) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload or signature.' })
  @ApiResponse({ status: 404, description: 'Webhook not found.' })
  async handleWebhook(
    @Param('id') webhookId: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received webhook: ${webhookId}`);
    
    try {
      await this.webhookManager.handleWebhook(webhookId, payload, headers);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Error processing webhook ${webhookId}:`, error.message);
      
      if (error.message.includes('Invalid webhook ID')) {
        throw new NotFoundException(`Webhook with ID "${webhookId}" not found.`);
      }
      
      if (error.message.includes('Invalid webhook signature')) {
        throw new BadRequestException('Invalid webhook signature.');
      }
      
      throw new BadRequestException(`Error processing webhook: ${error.message}`);
    }
  }
}