import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { Web3authModule } from '../web3auth/web3auth.module';
import { SmartAccountController } from './smart-account.controller';
import { SmartAccountService } from './smart-account.service';

@Module({
  imports: [Web3authModule, DatabaseModule],
  controllers: [SmartAccountController],
  providers: [SmartAccountService],
  exports: [SmartAccountService],
})
export class SmartAccountModule {}
