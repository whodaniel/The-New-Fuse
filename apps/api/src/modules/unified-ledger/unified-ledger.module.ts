import { Module } from '@nestjs/common';
import { AgentsModule } from '../../agents/agents.module';
import { LedgerScopeInterceptor } from './ledger-scope.interceptor';
import { UnifiedLedgerController } from './unified-ledger.controller';
import { UnifiedLedgerService } from './unified-ledger.service';

@Module({
  imports: [AgentsModule],
  controllers: [UnifiedLedgerController],
  providers: [UnifiedLedgerService, LedgerScopeInterceptor],
  exports: [UnifiedLedgerService],
})
export class UnifiedLedgerModule {}
