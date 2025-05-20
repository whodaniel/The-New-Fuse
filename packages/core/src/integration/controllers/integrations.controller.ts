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
} from '@nestjs/common';
import { IntegrationRegistryService } from '../services/integration-registry.service.js';
import { IntegrationType } from '@the-new-fuse/api-client/src/integrations/types'; // Adjusted import
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger'; // For API documentation

// --- DTOs for Request Bodies ---

class ConnectIntegrationDto {
  @ApiPropertyOptional({ description: 'Credentials needed for connection (e.g., API key, OAuth tokens)', type: 'object' })
  credentials?: Record<string, any>;
}

class ExecuteActionDto {
  @ApiProperty({ description: 'The action to execute on the integration', example: 'chat_completion' })
  action: string;

  @ApiPropertyOptional({ description: 'Parameters required for the action', type: 'object', example: { model: 'gpt-4', messages: [{ role: 'user', content: 'Hello!' }] } })
  params?: Record<string, any>;
}

// --- Controller ---

@ApiTags('Integrations')
@Controller('integrations')
// @UseGuards(AuthGuard) // Add appropriate guards later
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(private readonly integrationRegistryService: IntegrationRegistryService) {}

  @Get()
  @ApiOperation({ summary: 'List all available integrations' })
  @ApiResponse({ status: 200, description: 'List of integrations retrieved successfully.' })
  async listIntegrations() {
    this.logger.log('Request received to list all integrations');
    try {
      // Use getAllIntegrationsMetadata for richer info, or listIntegrations for basic
      const integrations = await this.integrationRegistryService.getAllIntegrationsMetadata();
      this.logger.log(`Returning ${integrations.length} integrations.`);
      return integrations;
    } catch (error) {
      this.logger.error('Failed to list integrations', error.stack);
      throw new InternalServerErrorException('Failed to retrieve integrations.');
    }
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'List integrations by type' })
  @ApiParam({ name: 'type', enum: IntegrationType, description: 'The type of integrations to list' })
  @ApiResponse({ status: 200, description: 'List of integrations by type retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid integration type provided.' })
  async listIntegrationsByType(@Param('type') type: IntegrationType) {
    this.logger.log(`Request received to list integrations of type: ${type}`);
    // Basic validation if the type exists in the enum
    if (!Object.values(IntegrationType).includes(type)) {
        throw new BadRequestException(`Invalid integration type: ${type}`);
    }
    try {
      // Assuming listIntegrationsByType returns metadata similar to getAllIntegrationsMetadata
      // If not, adjust accordingly or filter the result of getAllIntegrationsMetadata
      const integrations = (await this.integrationRegistryService.getAllIntegrationsMetadata())
                             .filter(int => int.type === type);
      this.logger.log(`Returning ${integrations.length} integrations of type ${type}.`);
      return integrations;
    } catch (error) {
      this.logger.error(`Failed to list integrations by type ${type}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve integrations of type ${type}.`);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details (metadata) of a specific integration' })
  @ApiParam({ name: 'id', description: 'The ID of the integration' })
  @ApiResponse({ status: 200, description: 'Integration metadata retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Integration not found.' })
  async getIntegrationDetails(@Param('id') id: string) {
    this.logger.log(`Request received for details of integration: ${id}`);
    try {
      const metadata = await this.integrationRegistryService.getIntegrationMetadata(id);
      return metadata;
    } catch (error) {
      if (error.message.includes('not found')) {
        this.logger.warn(`Integration not found: ${id}`);
        throw new NotFoundException(`Integration with ID "${id}" not found.`);
      }
      this.logger.error(`Failed to get details for integration ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve details for integration ${id}.`);
    }
  }

  @Post(':id/connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect to a specific integration' })
  @ApiParam({ name: 'id', description: 'The ID of the integration to connect' })
  @ApiBody({ type: ConnectIntegrationDto, required: false })
  @ApiResponse({ status: 200, description: 'Integration connected successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., missing credentials if required).' })
  @ApiResponse({ status: 404, description: 'Integration not found.' })
  @ApiResponse({ status: 500, description: 'Connection failed.' })
  async connectIntegration(
    @Param('id') id: string,
    @Body() connectDto?: ConnectIntegrationDto,
  ) {
    this.logger.log(`Request received to connect integration: ${id}`);
    try {
      const result = await this.integrationRegistryService.connectIntegration(id, connectDto?.credentials);
      return { message: `Integration ${id} connected successfully.`, connected: result };
    } catch (error) {
      if (error.message.includes('not found')) {
        this.logger.warn(`Connect failed - Integration not found: ${id}`);
        throw new NotFoundException(`Integration with ID "${id}" not found.`);
      }
      if (error.message.includes('required')) { // Basic check for credential errors
         this.logger.warn(`Connect failed - Bad request for ${id}: ${error.message}`);
         throw new BadRequestException(error.message);
      }
      this.logger.error(`Failed to connect integration ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to connect integration ${id}: ${error.message}`);
    }
  }

  @Post(':id/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect from a specific integration' })
  @ApiParam({ name: 'id', description: 'The ID of the integration to disconnect' })
  @ApiResponse({ status: 200, description: 'Integration disconnected successfully.' })
  @ApiResponse({ status: 404, description: 'Integration not found.' })
  @ApiResponse({ status: 500, description: 'Disconnection failed.' })
  async disconnectIntegration(@Param('id') id: string) {
    this.logger.log(`Request received to disconnect integration: ${id}`);
    try {
      const result = await this.integrationRegistryService.disconnectIntegration(id);
      return { message: `Integration ${id} disconnected successfully.`, disconnected: result };
    } catch (error) {
      if (error.message.includes('not found')) {
        this.logger.warn(`Disconnect failed - Integration not found: ${id}`);
        throw new NotFoundException(`Integration with ID "${id}" not found.`);
      }
      this.logger.error(`Failed to disconnect integration ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to disconnect integration ${id}: ${error.message}`);
    }
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute an action on a specific integration' })
  @ApiParam({ name: 'id', description: 'The ID of the integration' })
  @ApiBody({ type: ExecuteActionDto })
  @ApiResponse({ status: 200, description: 'Action executed successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., missing action/params, action not supported).' })
  @ApiResponse({ status: 404, description: 'Integration not found.' })
  @ApiResponse({ status: 500, description: 'Action execution failed.' })
  async executeAction(
    @Param('id') id: string,
    @Body() executeActionDto: ExecuteActionDto,
  ) {
    this.logger.log(`Request received to execute action "${executeActionDto.action}" on integration: ${id}`);
    if (!executeActionDto || !executeActionDto.action) {
      throw new BadRequestException('Action must be provided in the request body.');
    }

    try {
      const result = await this.integrationRegistryService.executeIntegrationAction(
        id,
        executeActionDto.action,
        executeActionDto.params,
      );
      // Avoid logging potentially large or sensitive results directly
      this.logger.log(`Action "${executeActionDto.action}" on integration ${id} executed successfully.`);
      return result; // Return the actual result from the integration action
    } catch (error) {
      if (error.message.includes('not found')) {
        this.logger.warn(`Execute failed - Integration not found: ${id}`);
        throw new NotFoundException(`Integration with ID "${id}" not found.`);
      }
      if (error.message.includes('not supported') || error.message.includes('required') || error.message.includes('must be provided')) {
         this.logger.warn(`Execute failed - Bad request for ${id}, action ${executeActionDto.action}: ${error.message}`);
         throw new BadRequestException(error.message);
      }
       if (error.message.includes('not connected')) {
         this.logger.warn(`Execute failed - Integration ${id} not connected for action ${executeActionDto.action}`);
         throw new BadRequestException(error.message); // Or perhaps a 409 Conflict
      }
      this.logger.error(`Failed to execute action "${executeActionDto.action}" on integration ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to execute action "${executeActionDto.action}" on integration ${id}: ${error.message}`);
    }
  }
}

// Add ApiProperty decorators to DTOs if swagger is used
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';