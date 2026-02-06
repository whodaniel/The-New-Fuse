import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { SmartAccountModule } from '../smart-accounts/smart-account.module';
import { Web3authModule } from '../web3auth/web3auth.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [Web3authModule, forwardRef(() => SmartAccountModule), DatabaseModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
