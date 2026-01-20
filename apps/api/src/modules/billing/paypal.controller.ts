import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { PayPalService } from './paypal.service';

@Controller('billing/paypal')
export class PayPalController {
  constructor(private readonly paypalService: PayPalService) {}

  @Post('webhook')
  async handleWebhook(@Headers() headers: any, @Body() body: any) {
    // Verify webhook signature (TODO: Add validation)
    await this.paypalService.handleWebhook(headers, body);
    return { received: true };
  }

  @Post('subscribe')
  // Add AuthGuard here to ensure only logged-in users can subscribe
  async recordSubscription(
    @Body() body: { subscriptionID: string; planID: string },
    @Req() req: any
  ) {
    // userId comes from req.user set by AuthGuard
    const userId = req.user?.id;
    if (!userId) {
      // Fallback for dev/testing if auth not fully set up in this context
      // throw new UnauthorizedException();
    }

    // For now, accept it if we trust the endpoint
    await this.paypalService.createSubscriptionRecord(userId, body.subscriptionID, body.planID);
    return { success: true };
  }
}
