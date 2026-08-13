import { Module } from '@nestjs/common';
import { UnifiedLedgerController } from './unified-ledger.controller.js';
import { UnifiedLedgerService } from './unified-ledger.service.js';

@Module({
  controllers: [UnifiedLedgerController],
  providers: [UnifiedLedgerService],
  exports: [UnifiedLedgerService],
})
export class UnifiedLedgerModule {}
