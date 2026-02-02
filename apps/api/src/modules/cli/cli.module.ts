/**
 * CLI Module
 *
 * NestJS module for CLI command execution functionality.
 * Provides the CLI controller and service for executing TNF CLI commands via API.
 *
 * @module CLIModule
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CLIController } from '../../controllers/cli.controller';
import { CLIService } from '../../services/cli.service';

/**
 * CLI Module
 *
 * Imports:
 * - ConfigModule: For accessing environment configuration
 *
 * Controllers:
 * - CLIController: REST API endpoints for CLI commands
 *
 * Providers:
 * - CLIService: Business logic for CLI command execution
 *
 * @example
 * // Import in AppModule
 * import { CLIModule } from './modules/cli/cli.module';
 *
 * @Module({
 *   imports: [CLIModule],
 * })
 * export class AppModule {}
 */
@Module({
  imports: [ConfigModule],
  controllers: [CLIController],
  providers: [CLIService],
  exports: [CLIService],
})
export class CLIModule {}
