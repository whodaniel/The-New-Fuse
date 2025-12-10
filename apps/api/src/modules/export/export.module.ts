import { Module } from '@nestjs/common';
import { ExportController } from '../../controllers/export.controller';

/**
 * Export Module
 *
 * Provides data export functionality for conversations and other system data.
 * This module supports multiple output formats and handles the conversion
 * of internal data structures to user-friendly export formats.
 *
 * Currently supports:
 * - JSON format for programmatic access
 * - Markdown format for documentation and reading
 * - HTML format for web viewing and printing
 */
@Module({
  controllers: [ExportController],
  providers: [],
  exports: [],
})
export class ExportModule {}
