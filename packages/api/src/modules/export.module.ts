import { Module } from '@nestjs/common';
import { ExportController } from '../controllers/export.controller';

@Module({
  controllers: [ExportController],
  providers: [],
  exports: []
})
export class ExportModule {}
