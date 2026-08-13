import { Module } from '@nestjs/common';

import { BillingModule } from '../../billing/billing.module';
import { GooseController } from './goose.controller';
import { GooseService } from './goose.service';

@Module({
  imports: [BillingModule],
  controllers: [GooseController],
  providers: [GooseService],
  exports: [GooseService],
})
export class GooseModule {}
