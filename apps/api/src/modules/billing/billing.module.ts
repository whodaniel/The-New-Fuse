import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { CommunityApiKeyGuard } from '../../guards/community-api-key.guard';
import { BillingController } from './billing.controller';
import { PayPalController } from './paypal.controller';
import { PayPalService } from './paypal.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule, DrizzleModule],
  controllers: [BillingController, PayPalController, StripeController],
  providers: [PayPalService, StripeService, CommunityApiKeyGuard],
  exports: [PayPalService, StripeService],
})
export class BillingModule {}
