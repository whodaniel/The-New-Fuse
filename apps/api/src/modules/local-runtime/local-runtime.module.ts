import { Module } from '@nestjs/common';
import { LocalRuntimeController } from './local-runtime.controller';
import { LocalRuntimeService } from './local-runtime.service';

@Module({
  controllers: [LocalRuntimeController],
  providers: [LocalRuntimeService],
  exports: [LocalRuntimeService],
})
export class LocalRuntimeModule {}
