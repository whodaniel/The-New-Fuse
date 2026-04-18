import { Module } from '@nestjs/common';
import { ExportController } from '../controllers/export.controller.js';

@Module({
  controllers: [ExportController],
  providers: [],
  exports: []
})
export class ExportModule {}
