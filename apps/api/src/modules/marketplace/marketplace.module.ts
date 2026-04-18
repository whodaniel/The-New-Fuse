import { Module } from '@nestjs/common';
import { MemberOrAdminGuard } from '../../guards/member-or-admin.guard.js';
import { BillingModule } from '../billing/billing.module.js';
import { MarketplaceController } from './marketplace.controller.js';
import { MarketplaceService } from './marketplace.service.js';

@Module({
  imports: [BillingModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MemberOrAdminGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
