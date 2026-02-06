import { Module } from '@nestjs/common';
import { ExportController } from '../controllers/export.controller';
// import { ConversationExportService } from '@the-new-fuse/core';

@Module({
  controllers: [ExportController],
  providers: [], // ConversationExportService temporarily disabled
  exports: [], // ConversationExportService temporarily disabled
})
export class ExportModule {}
