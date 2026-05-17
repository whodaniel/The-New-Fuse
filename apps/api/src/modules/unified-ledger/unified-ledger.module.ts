import { Module } from '@nestjs/common';
import { AgentsModule } from '../../agents/agents.module';
import { UnifiedLedgerController } from './unified-ledger.controller';
import { UnifiedLedgerService } from './unified-ledger.service';

@Module({
  imports: [AgentsModule],
  controllers: [UnifiedLedgerController],
  providers: [UnifiedLedgerService],
  exports: [UnifiedLedgerService],
})
export class UnifiedLedgerModule {}
