import { Module } from '@nestjs/common';
import { LlmConfigService } from '../../services/llm-config.service';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  providers: [LlmConfigService, PrismaService],
  exports: [LlmConfigService],
})
export class LlmModule {}
