import { Module } from '@nestjs/common';
import { UnifiedLedgerController } from './unified-ledger.controller';
import { UnifiedLedgerService } from './unified-ledger.service';

@Module({
  controllers: [UnifiedLedgerController],
  providers: [UnifiedLedgerService],
  exports: [UnifiedLedgerService],
})
export class UnifiedLedgerModule {}
