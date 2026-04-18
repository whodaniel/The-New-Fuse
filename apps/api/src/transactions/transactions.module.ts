import { Module, forwardRef } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { Web3authModule } from '../web3auth/web3auth.module.js';
import { SmartAccountModule } from '../smart-accounts/smart-account.module.js';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';

@Module({
  imports: [
    Web3authModule,
    forwardRef(() => SmartAccountModule),
    DatabaseModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}