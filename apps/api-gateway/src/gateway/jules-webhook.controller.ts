import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { JulesWebhookHandler } from '@the-new-fuse/jules-integration';

// This is a placeholder for the actual payload validation pipe
import { JulesWebhookPayload } from './jules-webhook.payload';

@Controller('api/webhooks/incoming/jules')
export class JulesWebhookController {
  constructor(private readonly webhookHandler: JulesWebhookHandler) {}

  @Post(':encodedContext')
  async handleJulesWebhook(
    @Param('encodedContext') encodedContext: string,
    @Body() payload: JulesWebhookPayload
  ): Promise<{ received: boolean }> {
    try {
      // Basic validation
      if (!encodedContext) {
        throw new BadRequestException('Encoded context is required');
      }

      await this.webhookHandler.handleWebhook(payload, encodedContext);
      return { received: true };
    } catch (error) {
      console.error(
        `[JulesWebhookController] Failed to handle webhook: ${error.message}`,
        error.stack
      );

      // Re-throw specific known errors or a generic one
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while processing the webhook.'
      );
    }
  }
}
