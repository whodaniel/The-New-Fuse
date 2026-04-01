import { Module } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { AccessBootstrapService } from './access-bootstrap.service';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  imports: [DrizzleModule, AuthModule, BillingModule],
  controllers: [AccessController],
  providers: [AccessService, AccessBootstrapService],
  exports: [AccessService],
})
export class AccessModule {}
