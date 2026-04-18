import { Module } from '@nestjs/common';
import { SmartAccountService } from './smart-account.service.js';
import { SmartAccountController } from './smart-account.controller.js';
import { Web3authModule } from '../web3auth/web3auth.module.js';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';

@Module({
  imports: [Web3authModule, DatabaseModule],
  controllers: [SmartAccountController],
  providers: [SmartAccountService],
  exports: [SmartAccountService]
})
export class SmartAccountModule {}