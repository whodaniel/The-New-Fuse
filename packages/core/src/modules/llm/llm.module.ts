import { Module } from '@nestjs/common';
import { LlmConfigService } from '../../services/llm-config.service';
import { EncryptionService } from '../../security/encryption';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  providers: [LlmConfigService, EncryptionService, PrismaService],
  exports: [LlmConfigService],
})
export class LlmModule {}
