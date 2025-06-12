/**
 * Root-Level Agency Controller
 * Provides simplified agency management endpoints for direct integration
 * This controller acts as a bridge between external services and the core agency hub
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// Import from core packages
import { EnhancedAgencyService } from './packages/core/src/services/enhanced-agency.service';
import { AgentSwarmOrchestrationService } from './agent-swarm-orchestration.service';

export interface SimpleAgencyRequest {
  name: string;
  subdomain: string;
  adminEmail: string;
  adminName: string;
  enableSwarmOrchestration?: boolean;
}

export interface AgencyStatusResponse {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  swarmEnabled: boolean;
  activeAgents: number;
  lastActivity: Date;
}

@ApiTags('Agency Management')
@Controller('agency')
@Injectable()
export class AgencyController {
  private readonly logger = new Logger(AgencyController.name);

  constructor(
    private readonly enhancedAgencyService: EnhancedAgencyService,
    private readonly swarmOrchestrationService: AgentSwarmOrchestrationService
  ) {}

  /**
   * Create a new agency with simplified configuration
   */
  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: 201, description: 'Agency created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Subdomain already exists' })
  @HttpCode(HttpStatus.CREATED)
  async createAgency(@Body() createAgencyDto: SimpleAgencyRequest) {
    this.logger.log(`Creating new agency: ${createAgencyDto.name}`);
    
    try {
      // Use enhanced agency service for creation
      const agency = await this.enhancedAgencyService.createAgency({
        ...createAgencyDto,
        adminPassword: this.generateTemporaryPassword(),
        tier: 'BASIC',
        enableServiceRouting: true,
        defaultServiceCategories: ['general', 'communication', 'analysis']
      });

      // Initialize swarm orchestration if enabled
      if (createAgencyDto.enableSwarmOrchestration) {
        await this.swarmOrchestrationService.initializeAgencySwarm(agency.id);
      }
      
      this.logger.log(`Agency created successfully: ${agency.id}`);
      
      return {
        success: true,
        data: {
          id: agency.id,
          name: agency.name,
          subdomain: agency.subdomain,
          swarmEnabled: createAgencyDto.enableSwarmOrchestration || false,
          status: 'active'
        },
        message: 'Agency created successfully'
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to create agency: ${(error as Error).message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get agency status and basic information
   */
  @Get(':agencyId')
  @ApiOperation({ summary: 'Get agency status' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Agency status retrieved' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async getAgencyStatus(@Param('agencyId') agencyId: string): Promise<AgencyStatusResponse> {
    this.logger.log(`Retrieving agency status: ${agencyId}`);
    
    const agency = await this.enhancedAgencyService.getAgencyById(agencyId);
    const swarmStatus = await this.swarmOrchestrationService.getSwarmStatus(agencyId);
    
    return {
      id: agency.id,
      name: agency.name,
      subdomain: agency.subdomain,
      status: agency.status as 'active' | 'inactive' | 'suspended',
      swarmEnabled: swarmStatus.isSwarmEnabled,
      activeAgents: swarmStatus.activeProviders,
      lastActivity: new Date() // This should come from actual activity tracking
    };
  }

  /**
   * List all agencies with basic information
   */
  @Get()
  @ApiOperation({ summary: 'List all agencies' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Agencies retrieved successfully' })
  async listAgencies(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    this.logger.log('Retrieving agencies list');
    
    const agencies = await this.enhancedAgencyService.getAllAgencies({
      page,
      limit
    });

    const agencyStatuses = await Promise.all(
      agencies.map(async (agency) => {
        const swarmStatus = await this.swarmOrchestrationService.getSwarmStatus(agency.id);
        return {
          id: agency.id,
          name: agency.name,
          subdomain: agency.subdomain,
          status: agency.status,
          swarmEnabled: swarmStatus.isSwarmEnabled,
          activeAgents: swarmStatus.activeProviders
        };
      })
    );

    return {
      success: true,
      data: agencyStatuses,
      pagination: {
        page,
        limit,
        total: agencies.length
      }
    };
  }

  /**
   * Enable/disable swarm orchestration for an agency
   */
  @Put(':agencyId/swarm')
  @ApiOperation({ summary: 'Toggle swarm orchestration for agency' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Swarm configuration updated' })
  async toggleSwarmOrchestration(
    @Param('agencyId') agencyId: string,
    @Body() body: { enabled: boolean }
  ) {
    this.logger.log(`Toggling swarm orchestration for agency: ${agencyId}, enabled: ${body.enabled}`);
    
    if (body.enabled) {
      await this.swarmOrchestrationService.initializeAgencySwarm(agencyId);
    } else {
      await this.swarmOrchestrationService.disableAgencySwarm(agencyId);
    }

    return {
      success: true,
      message: `Swarm orchestration ${body.enabled ? 'enabled' : 'disabled'} for agency`
    };
  }

  /**
   * Get agency swarm metrics
   */
  @Get(':agencyId/metrics')
  @ApiOperation({ summary: 'Get agency swarm metrics' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getAgencyMetrics(@Param('agencyId') agencyId: string) {
    this.logger.log(`Retrieving metrics for agency: ${agencyId}`);
    
    const swarmStatus = await this.swarmOrchestrationService.getSwarmStatus(agencyId);
    const executionMetrics = await this.swarmOrchestrationService.getExecutionMetrics(agencyId);
    
    return {
      success: true,
      data: {
        swarmStatus,
        executionMetrics,
        timestamp: new Date()
      }
    };
  }

  /**
   * Delete an agency (soft delete)
   */
  @Delete(':agencyId')
  @ApiOperation({ summary: 'Delete an agency' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Agency deleted successfully' })
  async deleteAgency(@Param('agencyId') agencyId: string) {
    this.logger.log(`Deleting agency: ${agencyId}`);
    
    // Disable swarm first
    await this.swarmOrchestrationService.disableAgencySwarm(agencyId);
    
    // Soft delete the agency
    await this.enhancedAgencyService.deleteAgency(agencyId);
    
    return {
      success: true,
      message: 'Agency deleted successfully'
    };
  }

  /**
   * Generate a temporary password for new agencies
   * In production, this should be replaced with a more secure method
   */
  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }
}