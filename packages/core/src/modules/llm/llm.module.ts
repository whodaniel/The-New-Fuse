import { Module } from '@nestjs/common';
import { LlmConfigService } from '../../services/llm-config.service.js';
// @ts-ignore
import { DrizzleModule } from '@the-new-fuse/database';

@Module({
  imports: [DrizzleModule.forRoot()],
  providers: [LlmConfigService],
  exports: [LlmConfigService],
})
export class LlmModule {}
