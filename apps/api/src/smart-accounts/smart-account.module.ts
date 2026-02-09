import { Module } from '@nestjs/common';
import { SmartAccountService } from './smart-account.service';
import { SmartAccountController } from './smart-account.controller';
import { Web3authModule } from '../web3auth/web3auth.module';
import { DatabaseModule } from '@the-new-fuse/database';

@Module({
  imports: [Web3authModule, DatabaseModule],
  controllers: [SmartAccountController],
  providers: [SmartAccountService],
  exports: [SmartAccountService]
})
export class SmartAccountModule {}