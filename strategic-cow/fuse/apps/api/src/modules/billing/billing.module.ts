import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { PayPalController } from './paypal.controller';
import { PayPalService } from './paypal.service';

@Module({
  imports: [ConfigModule, DrizzleModule],
  controllers: [PayPalController],
  providers: [PayPalService],
  exports: [PayPalService],
})
export class BillingModule {}
