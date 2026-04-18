import { Module } from '@nestjs/common';
import { MemberOrAdminGuard } from '../../guards/member-or-admin.guard';
import { BillingModule } from '../billing/billing.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [BillingModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MemberOrAdminGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
