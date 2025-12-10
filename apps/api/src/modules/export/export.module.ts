import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExportController } from '../../controllers/export.controller';
import { SecurityLoggingService } from '../../security/security-logging.service';

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
  imports: [JwtModule],
  controllers: [ExportController],
  providers: [SecurityLoggingService],
  exports: [],
})
export class ExportModule {}
