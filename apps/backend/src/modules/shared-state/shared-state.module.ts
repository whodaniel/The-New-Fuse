import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedStateController } from './shared-state.controller.js';
import { SharedStateService } from './shared-state.service.js';

@Module({
  imports: [ConfigModule],
  controllers: [SharedStateController],
  providers: [SharedStateService],
  exports: [SharedStateService],
})
export class SharedStateModule {}
