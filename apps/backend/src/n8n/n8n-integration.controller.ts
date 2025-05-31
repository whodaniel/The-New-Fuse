import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@the-new-fuse/utils';
import { N8nMetadataService } from './n8n-metadata.service.js';
import { WorkflowValidator } from './workflow.validator.js';

@Controller('n8n')
export class N8nIntegrationController {
  private readonly logger: Logger;
  private readonly validator: WorkflowValidator;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly metadataService: N8nMetadataService,
  ) {
    this.logger = new Logger({ prefix: 'N8nIntegrationController' });
    this.validator = new WorkflowValidator();
  }

  @Post('workflow')
  async createWorkflow(@Body() workflowData: any) {
    try {
      // Validate workflow structure
      const nodeTypes = await this.metadataService.getAllNodeTypes();
      const validationErrors = this.validator.validate(workflowData.nodes, workflowData.edges, nodeTypes);
      
      if (validationErrors.length > 0) {
        throw new HttpException({
          status: HttpStatus.BAD_REQUEST,
          error: 'Invalid workflow',
          details: validationErrors,
        }, HttpStatus.BAD_REQUEST);
      }

      const n8nUrl = this.configService.get<string>('N8N_URL');
      const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

      if (!n8nUrl || !n8nApiKey) {
        throw new Error('N8N configuration missing');
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${n8nUrl}/api/v1/workflows`,
          {
            name: workflowData.name || 'New Workflow',
            active: false,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            settings: {
              saveDataErrorExecution: 'all',
              saveDataSuccessExecution: 'all',
              saveManualExecutions: true,
              timezone: 'UTC',
            },
          },
          {
            headers: {
              'X-N8N-API-KEY': n8nApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workflow', error);
      throw error;
    }
  }

  @Get('node-types')
  async getNodeTypes() {
    try {
      return await this.metadataService.getAllNodeTypes();
    } catch (error) {
      this.logger.error('Failed to fetch node types', error);
      throw error;
    }
  }

  @Get('node-types/:type')
  async getNodeTypeDescription(@Param('type') type: string) {
    try {
      return await this.metadataService.getNodeTypeDescription(type);
    } catch (error) {
      this.logger.error(`Failed to fetch node type description for ${type}`, error);
      throw error;
    }
  }

  @Get('credentials/:type')
  async getCredentials(@Param('type') type: string) {
    try {
      const n8nUrl = this.configService.get<string>('N8N_URL');
      const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

      if (!n8nUrl || !n8nApiKey) {
        throw new Error('N8N configuration missing');
      }

      const response = await firstValueFrom(
        this.httpService.get(
          `${n8nUrl}/api/v1/credentials?type=${type}`,
          {
            headers: {
              'X-N8N-API-KEY': n8nApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch credentials for type ${type}`, error);
      throw error;
    }
  }

  @Post('test-workflow')
  async testWorkflow(@Body() workflowData: any) {
    try {
      const n8nUrl = this.configService.get<string>('N8N_URL');
      const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

      if (!n8nUrl || !n8nApiKey) {
        throw new Error('N8N configuration missing');
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${n8nUrl}/api/v1/workflows/test`,
          {
            workflowData: {
              nodes: workflowData.nodes,
              connections: workflowData.connections,
            },
          },
          {
            headers: {
              'X-N8N-API-KEY': n8nApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to test workflow', error);
      throw error;
    }
  }
}
