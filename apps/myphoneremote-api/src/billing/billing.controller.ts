import { Body, Controller, Headers, Post, RawBody } from '@nestjs/common';
import { BillingService } from './billing.service';

interface CreateCheckoutDto {
  priceId: string;
  userId: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  mode?: 'subscription' | 'payment';
}

@Controller('api/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe/checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(dto);
  }

  @Post('stripe/webhook')
  async handleWebhook(@RawBody() rawBody: Buffer, @Headers('stripe-signature') signature: string) {
    return this.billingService.handleWebhookEvent(rawBody, signature);
  }
}
