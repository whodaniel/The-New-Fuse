import { Module, forwardRef } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Web3authModule } from '../web3auth/web3auth.module';
import { SmartAccountModule } from '../smart-accounts/smart-account.module';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  imports: [
    Web3authModule,
    forwardRef(() => SmartAccountModule)
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService],
  exports: [TransactionsService]
})
export class TransactionsModule {}