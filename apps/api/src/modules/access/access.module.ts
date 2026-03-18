import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  imports: [DrizzleModule, AuthModule, BillingModule],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
