import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { IntegrationRegistryService } from '../services/integration-registry.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { IntegrationType } from '../../api-client/src/integrations/types.js';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationRegistryService: IntegrationRegistryService) {}

  @Get()
  @ApiOperation({ summary: 'List all integrations' })
  @ApiQuery({ name: 'type', enum: IntegrationType, required: false, description: 'Filter integrations by type' })
  @ApiResponse({ status: 200, description: 'Returns a list of all registered integrations or filtered by type' })
  async listIntegrations(@Query('type') type?: IntegrationType) {
    if (type) {
      return this.integrationRegistryService.listIntegrationsByType(type);
    }
    return this.integrationRegistryService.listIntegrations();
  }

  @Get('metadata')
  @ApiOperation({ summary: 'Get metadata for all integrations' })
  @ApiResponse({ status: 200, description: 'Returns metadata for all registered integrations' })
  async getAllMetadata() {
    return this.integrationRegistryService.getAllIntegrationsMetadata();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Returns the integration details' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async getIntegration(@Param('id') id: string) {
    const integration = this.integrationRegistryService.getIntegration(id);
    if (!integration) {
      return { status: 'error', message: `Integration not found: ${id}` };
    }
    return integration;
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get integration metadata' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Returns the integration metadata' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async getIntegrationMetadata(@Param('id') id: string) {
    try {
      return await this.integrationRegistryService.getIntegrationMetadata(id);
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post(':id/connect')
  @ApiOperation({ summary: 'Connect to integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Successfully connected to integration' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  @ApiResponse({ status: 400, description: 'Failed to connect to integration' })
  async connectIntegration(@Param('id') id: string) {
    try {
      const result = await this.integrationRegistryService.connectIntegration(id);
      return { status: 'success', connected: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post(':id/disconnect')
  @ApiOperation({ summary: 'Disconnect from integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Successfully disconnected from integration' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  @ApiResponse({ status: 400, description: 'Failed to disconnect from integration' })
  async disconnectIntegration(@Param('id') id: string) {
    try {
      const result = await this.integrationRegistryService.disconnectIntegration(id);
      return { status: 'success', disconnected: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post(':id/execute/:action')
  @ApiOperation({ summary: 'Execute an action on an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiParam({ name: 'action', description: 'Action to execute' })
  @ApiBody({ description: 'Parameters for the action', required: false })
  @ApiResponse({ status: 200, description: 'Action executed successfully' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  @ApiResponse({ status: 400, description: 'Failed to execute action' })
  async executeAction(
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() params: Record<string, any> = {},
  ) {
    try {
      const result = await this.integrationRegistryService.executeIntegrationAction(id, action, params);
      return { status: 'success', result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}