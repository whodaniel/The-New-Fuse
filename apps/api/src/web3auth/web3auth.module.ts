import { Module } from '@nestjs/common';
import { Web3authService } from './web3auth.service.js';

@Module({
  providers: [Web3authService],
  exports: [Web3authService]
})
export class Web3authModule {}