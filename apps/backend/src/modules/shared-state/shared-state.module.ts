import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedStateController } from './shared-state.controller';
import { SharedStateService } from './shared-state.service';

@Module({
  imports: [ConfigModule],
  controllers: [SharedStateController],
  providers: [SharedStateService],
  exports: [SharedStateService],
})
export class SharedStateModule {}
