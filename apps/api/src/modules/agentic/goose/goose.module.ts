import { Module } from '@nestjs/common';

import { BillingModule } from '../../billing/billing.module.js';
import { GooseController } from './goose.controller.js';
import { GooseService } from './goose.service.js';

@Module({
  imports: [BillingModule],
  controllers: [GooseController],
  providers: [GooseService],
  exports: [GooseService],
})
export class GooseModule {}
