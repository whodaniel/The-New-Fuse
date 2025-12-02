import { Module, forwardRef } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Web3authModule } from '../web3auth/web3auth.module';
import { SmartAccountModule } from '../smart-accounts/smart-account.module';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  imports: [
    Web3authModule,
    forwardRef(() => SmartAccountModule)
  ],
  controllers: [WalletsController],
  providers: [WalletsService, PrismaService],
  exports: [WalletsService]
})
export class WalletsModule {}