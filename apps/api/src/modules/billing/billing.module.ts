import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { CommunityApiKeyGuard } from '../../guards/community-api-key.guard.js';
import { BillingController } from './billing.controller.js';
import { PayPalController } from './paypal.controller.js';
import { PayPalService } from './paypal.service.js';
import { StripeController } from './stripe.controller.js';
import { StripeService } from './stripe.service.js';

@Module({
  imports: [ConfigModule, DrizzleModule],
  controllers: [BillingController, PayPalController, StripeController],
  providers: [PayPalService, StripeService, CommunityApiKeyGuard],
  exports: [PayPalService, StripeService],
})
export class BillingModule {}
