import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { AccessBootstrapService } from './access-bootstrap.service.js';
import { AccessController } from './access.controller.js';
import { AccessService } from './access.service.js';

@Module({
  imports: [DrizzleModule, AuthModule, BillingModule],
  controllers: [AccessController],
  providers: [AccessService, AccessBootstrapService],
  exports: [AccessService],
})
export class AccessModule {}
