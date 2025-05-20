import { Module } from '@nestjs/common';
import { ExportController } from '../controllers/export.controller.js';
import { ConversationExportService } from '@the-new-fuse/core/src/services/ConversationExportService';

@Module({
  controllers: [ExportController],
  providers: [ConversationExportService],
  exports: [ConversationExportService]
})
export class ExportModule {}
