/**
 * CLI Controller
 *
 * Handles execution of TNF CLI commands from the frontend via API calls.
 * Provides a secure bridge between the web UI and CLI functionality.
 *
 * @module CLIController
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { CLIService } from '../services/cli.service';

/**
 * DTO for CLI command execution requests
 */
export interface ExecuteCommandDto {
  /** Command category (agent, task, workflow, config, monitoring) */
  category: string;
  /** Command ID/name */
  command: string;
  /** Command arguments */
  args?: Record<string, unknown>;
  /** Command options/flags */
  options?: Record<string, unknown>;
}

/**
 * DTO for CLI command execution responses
 */
export interface ExecuteCommandResponse {
  /** Whether the command executed successfully */
  success: boolean;
  /** Command output/result */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Execution timestamp */
  timestamp: string;
  /** Execution duration in milliseconds */
  duration: number;
  /** Command that was executed */
  command: string;
  /** Command category */
  category: string;
}

/**
 * CLI Command Information
 */
export interface CLICommandInfo {
  /** Command ID */
  id: string;
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command category */
  category: string;
  /** Available arguments */
  args?: Array<{
    name: string;
    description: string;
    required: boolean;
    type: string;
  }>;
  /** Available options */
  options?: Array<{
    name: string;
    description: string;
    alias?: string;
    type: string;
    default?: unknown;
  }>;
}

/**
 * CLI Command Categories
 */
export type CLICategory =
  | 'agent'
  | 'task'
  | 'workflow'
  | 'config'
  | 'monitoring'
  | 'message'
  | 'conversation'
  | 'ide';

/**
 * CLI Controller
 *
 * Provides REST API endpoints for executing TNF CLI commands.
 * All endpoints require authentication and are rate-limited.
 *
 * @example
 * // Execute a command
 * POST /cli/execute
 * {
 *   "category": "agent",
 *   "command": "list",
 *   "options": { "online": true }
 * }
 *
 * @example
 * // Get available commands
 * GET /cli/commands
 *
 * @example
 * // Get commands by category
 * GET /cli/commands?category=agent
 */
@ApiTags('CLI')
@Controller('cli')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class CLIController {
  private readonly logger = new Logger(CLIController.name);

  constructor(private readonly cliService: CLIService) {}

  /**
   * Execute a CLI command
   *
   * Executes the specified CLI command with provided arguments and options.
   * Returns the command output or error details.
   *
   * @param dto - Command execution request
   * @returns Command execution result
   *
   * @example
   * POST /cli/execute
   * {
   *   "category": "agent",
   *   "command": "list",
   *   "options": {
   *     "online": true,
   *     "skills": "typescript"
   *   }
   * }
   */
  @Post('execute')
  @ApiOperation({ summary: 'Execute a CLI command' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Command executed successfully',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid command or parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Command execution failed',
  })
  async executeCommand(@Body() dto: ExecuteCommandDto): Promise<ExecuteCommandResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Executing CLI command: ${dto.category}.${dto.command}`);

      const result = await this.cliService.executeCommand(dto);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        command: dto.command,
        category: dto.category,
      };
    } catch (error) {
      this.logger.error(
        `CLI command failed: ${dto.category}.${dto.command}`,
        (error as Error).message
      );

      throw new HttpException(
        {
          success: false,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          command: dto.command,
          category: dto.category,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get available CLI commands
   *
   * Returns a list of all available CLI commands, optionally filtered by category.
   *
   * @param category - Optional category filter
   * @returns List of available commands
   *
   * @example
   * GET /cli/commands
   * GET /cli/commands?category=agent
   */
  @Get('commands')
  @ApiOperation({ summary: 'Get available CLI commands' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of available commands',
    type: [Object],
  })
  async getCommands(@Query('category') category?: CLICategory): Promise<CLICommandInfo[]> {
    try {
      return this.cliService.getCommands(category);
    } catch (error) {
      this.logger.error('Failed to get CLI commands', (error as Error).message);
      throw new HttpException('Failed to retrieve CLI commands', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get CLI command categories
   *
   * Returns a list of all available CLI command categories.
   *
   * @returns List of command categories
   *
   * @example
   * GET /cli/categories
   */
  @Get('categories')
  @ApiOperation({ summary: 'Get CLI command categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of command categories',
    type: [String],
  })
  async getCategories(): Promise<string[]> {
    return ['agent', 'task', 'workflow', 'config', 'monitoring', 'message', 'conversation', 'ide'];
  }

  /**
   * Get CLI health status
   *
   * Returns the health status of the CLI service and its dependencies.
   *
   * @returns Health status information
   *
   * @example
   * GET /cli/health
   */
  @Get('health')
  @ApiOperation({ summary: 'Get CLI service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CLI service health status',
    type: Object,
  })
  async getHealth(): Promise<{
    status: string;
    redis: boolean;
    timestamp: string;
  }> {
    try {
      return await this.cliService.getHealth();
    } catch (error) {
      this.logger.error('Health check failed', (error as Error).message);
      return {
        status: 'unhealthy',
        redis: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute agent commands
   *
   * Specialized endpoint for agent-related CLI commands.
   *
   * @param command - Command name
   * @param args - Command arguments
   * @returns Command execution result
   */
  @Post('agent/:command')
  @ApiOperation({ summary: 'Execute agent CLI command' })
  async executeAgentCommand(
    @Body('command') command: string,
    @Body() args: Record<string, unknown>
  ): Promise<ExecuteCommandResponse> {
    return this.executeCommand({
      category: 'agent',
      command,
      args,
    });
  }

  /**
   * Execute task commands
   *
   * Specialized endpoint for task-related CLI commands.
   *
   * @param command - Command name
   * @param args - Command arguments
   * @returns Command execution result
   */
  @Post('task/:command')
  @ApiOperation({ summary: 'Execute task CLI command' })
  async executeTaskCommand(
    @Body('command') command: string,
    @Body() args: Record<string, unknown>
  ): Promise<ExecuteCommandResponse> {
    return this.executeCommand({
      category: 'task',
      command,
      args,
    });
  }

  /**
   * Execute workflow commands
   *
   * Specialized endpoint for workflow-related CLI commands.
   *
   * @param command - Command name
   * @param args - Command arguments
   * @returns Command execution result
   */
  @Post('workflow/:command')
  @ApiOperation({ summary: 'Execute workflow CLI command' })
  async executeWorkflowCommand(
    @Body('command') command: string,
    @Body() args: Record<string, unknown>
  ): Promise<ExecuteCommandResponse> {
    return this.executeCommand({
      category: 'workflow',
      command,
      args,
    });
  }

  /**
   * Execute config commands
   *
   * Specialized endpoint for config-related CLI commands.
   *
   * @param command - Command name
   * @param args - Command arguments
   * @returns Command execution result
   */
  @Post('config/:command')
  @ApiOperation({ summary: 'Execute config CLI command' })
  async executeConfigCommand(
    @Body('command') command: string,
    @Body() args: Record<string, unknown>
  ): Promise<ExecuteCommandResponse> {
    return this.executeCommand({
      category: 'config',
      command,
      args,
    });
  }

  /**
   * Execute monitoring commands
   *
   * Specialized endpoint for monitoring-related CLI commands.
   *
   * @param command - Command name
   * @param args - Command arguments
   * @returns Command execution result
   */
  @Post('monitoring/:command')
  @ApiOperation({ summary: 'Execute monitoring CLI command' })
  async executeMonitoringCommand(
    @Body('command') command: string,
    @Body() args: Record<string, unknown>
  ): Promise<ExecuteCommandResponse> {
    return this.executeCommand({
      category: 'monitoring',
      command,
      args,
    });
  }

  /**
   * Execute IDE commands
   *
   * Specialized endpoint for IDE-related CLI commands.
   *
   * @param command - Command name
   * @param args - Command arguments
   * @returns Command execution result
   */
  @Post('ide/:command')
  @ApiOperation({ summary: 'Execute IDE CLI command' })
  async executeIDECommand(
    @Body('command') command: string,
    @Body() args: Record<string, unknown>
  ): Promise<ExecuteCommandResponse> {
    return this.executeCommand({
      category: 'ide',
      command,
      args,
    });
  }
}
