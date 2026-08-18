import { Module } from '@nestjs/common';
import { HarnessController } from './harness.controller';
import { HarnessService } from './harness.service';

@Module({
  controllers: [HarnessController],
  providers: [HarnessService],
  exports: [HarnessService],
})
export class HarnessModule {}
