import { Module, forwardRef } from '@nestjs/common';
import { SmartAccountService } from './smart-account.service';
import { SmartAccountController } from './smart-account.controller';
import { Web3authModule } from '../web3auth/web3auth.module';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  imports: [Web3authModule],
  controllers: [SmartAccountController],
  providers: [SmartAccountService, PrismaService],
  exports: [SmartAccountService]
})
export class SmartAccountModule {}