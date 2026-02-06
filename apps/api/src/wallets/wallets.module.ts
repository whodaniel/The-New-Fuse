import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { SmartAccountModule } from '../smart-accounts/smart-account.module';
import { Web3authModule } from '../web3auth/web3auth.module';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [Web3authModule, forwardRef(() => SmartAccountModule), DatabaseModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
