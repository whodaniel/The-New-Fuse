import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';

// This is a placeholder for the actual payload validation pipe
import { JulesWebhookPayload } from './jules-webhook.payload';

type JulesWebhookHandlerLike = {
  handleWebhook: (payload: JulesWebhookPayload, encodedContext: string) => Promise<void>;
};

@Controller('api/webhooks/incoming/jules')
export class JulesWebhookController {
  constructor(
    @Inject('JULES_WEBHOOK_HANDLER') private readonly webhookHandler: JulesWebhookHandlerLike
  ) {}

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
    } catch (error: any) {
      console.error(
        `[JulesWebhookController] Failed to handle webhook: ${error?.message || 'Unknown error'}`,
        error?.stack
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
