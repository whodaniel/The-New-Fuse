import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// @ts-ignore
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { CommunityApiKeyGuard } from '../../guards/community-api-key.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { BillingController } from './billing.controller';
import { PayPalController } from './paypal.controller';
import { PayPalService } from './paypal.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule, DrizzleModule, JwtModule],
  controllers: [BillingController, PayPalController, StripeController],
  providers: [PayPalService, StripeService, CommunityApiKeyGuard, JwtAuthGuard],
  exports: [PayPalService, StripeService],
})
export class BillingModule {}
