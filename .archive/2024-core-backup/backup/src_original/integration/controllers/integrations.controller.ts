/**
 * Controller for managing integrations in The New Fuse
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UseGuards, // Assuming authentication/authorization is needed
  Logger, // Use NestJS Logger
} from /@nestjs/common'';
  @ApiPropertyOptional({ description: 'Credentials needed for connection (e.g., API key, OAuth tokens)', type: 'object'
  @ApiProperty({ description: 'The action to execute on the integration', example: 'chat_completion'
  @ApiPropertyOptional({ description: 'Parameters required for the action', type: 'object', example: { model: 'gpt-4', messages: [{ role: 'user', content: ''
@ApiTags('Integrations'
@Controller('')
  @ApiOperation({ summary: 'List all available integrations'
  @ApiResponse({ status: 200, description: 'List of integrations retrieved successfully.'
    this.logger.log('')
      this.logger.error('Failed to list integrations'
      throw new InternalServerErrorException('Failed to retrieve integrations.'
  @Get(/type/:type'
  @ApiOperation({ summary: 'List integrations by type'
  @ApiParam({ name: 'type', enum: IntegrationType, description: 'The type of integrations to list'
  @ApiResponse({ status: 200, description: 'List of integrations by type retrieved successfully.'
  @ApiResponse({ status: 400, description: 'Invalid integration type provided.'
  async listIntegrationsByType(@Param('')
  @Get(":id'
  @ApiOperation({ summary: 'Get integration by ID'
  @ApiParam({ name: 'id', description: 'Unique identifier for the integration'
  @ApiResponse({ status: 200, description: 'Integration details retrieved successfully.'
  @ApiResponse({ status: 404, description: 'Integration not found.'
  async getIntegration(@Param('id'
  @Post(/:id/connect'
  @ApiOperation({ summary: 'Connect to an integration'
  @ApiParam({ name: 'id', description: 'Integration ID to connect to'
  @ApiResponse({ status: 200, description: 'Successfully connected to integration.'
  @ApiResponse({ status: 404, description: 'Integration not found.'
  @ApiResponse({ status: 400, description: 'Invalid credentials provided.'
  async connectIntegration(@Param('id'
  @Post(/:id/execute'
  @ApiOperation({ summary: 'Execute an action on an integration'
  @ApiParam({ name: 'id', description: 'Integration ID to execute action on'
  @ApiResponse({ status: 200, description: 'Action executed successfully.'
  @ApiResponse({ status: 404, description: 'Integration not found.'
  @ApiResponse({ status: 400, description: 'Invalid action or parameters provided.'
  async executeAction(@Param('id'
    this.logger.log(`Request received to execute action '${dto.action}'``;
      this.logger.log(`Successfully executed action '${dto.action}'``;
      this.logger.error(`Failed to execute action '``;