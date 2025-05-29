/**
 * Agency Hub Controller - Main API endpoints for agency management
 * Handles agency creation, management, and tenant operations
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
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { EnhancedAgencyService } from '../services/enhanced-agency.service';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { TenantContext } from '../decorators/tenant-context.decorator';

export interface CreateAgencyRequest {
  name: string;
  subdomain: string;
  slug?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  tier?: string;
  billingEmail?: string;
  template?: string;
  customDomain?: string;
  enableSwarmOrchestration?: boolean;
  enableServiceRouting?: boolean;
  defaultServiceCategories?: string[];
}

export interface AgencyUpdateRequest {
  name?: string;
  billingEmail?: string;
  settings?: any;
  branding?: any;
  swarmConfiguration?: {
    maxConcurrentExecutions?: number;
    defaultQualityThreshold?: number;
    enableAutoScaling?: boolean;
  };
}

@ApiTags('Agency Hub')
@Controller('api/agency-hub')
export class AgencyHubController {
  private readonly logger = new Logger(AgencyHubController.name);

  constructor(
    private readonly enhancedAgencyService: EnhancedAgencyService
  ) {}

  /**
   * Master Admin Endpoints - Platform-wide agency management
   */

  @Post('agencies')
  @ApiOperation({ summary: 'Create a new agency (Master Admin only)' })
  @ApiResponse({ status: 201, description: 'Agency created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Subdomain already exists' })
  @Roles('MASTER_ADMIN')
  @UseGuards(AgencyRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAgency(@Body() createAgencyDto: CreateAgencyRequest) {
    this.logger.log(`Creating new agency: ${createAgencyDto.name}`);
    
    try {
      const agency = await this.enhancedAgencyService.createAgency(createAgencyDto);
      
      this.logger.log(`Agency created successfully: ${agency.id}`);
      
      return {
        success: true,
        data: agency,
        message: 'Agency created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to create agency: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('agencies')
  @ApiOperation({ summary: 'List all agencies (Master Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Agencies retrieved successfully' })
  @Roles('MASTER_ADMIN')
  @UseGuards(AgencyRoleGuard)
  async getAllAgencies(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('tier') tier?: string,
    @Query('status') status?: string
  ) {
    this.logger.log('Retrieving all agencies for master admin');
    
    const agencies = await this.enhancedAgencyService.getAllAgencies({
      page,
      limit,
      tier,
      status
    });

    return {
      success: true,
      data: agencies,
      pagination: {
        page,
        limit,
        total: agencies.length
      }
    };
  }

  @Get('agencies/:agencyId')
  @ApiOperation({ summary: 'Get agency details (Master Admin only)' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Agency details retrieved' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @Roles('MASTER_ADMIN')
  @UseGuards(AgencyRoleGuard)
  async getAgencyById(@Param('agencyId') agencyId: string) {
    this.logger.log(`Retrieving agency details: ${agencyId}`);
    
    const agency = await this.enhancedAgencyService.getAgencyById(agencyId);
    
    return {
      success: true,
      data: agency
    };
  }

  @Put('agencies/:agencyId')
  @ApiOperation({ summary: 'Update agency (Master Admin only)' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Agency updated successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @Roles('MASTER_ADMIN')
  @UseGuards(AgencyRoleGuard)
  async updateAgency(
    @Param('agencyId') agencyId: string,
    @Body() updateData: AgencyUpdateRequest
  ) {
    this.logger.log(`Updating agency: ${agencyId}`);
    
    const updatedAgency = await this.enhancedAgencyService.updateAgency(agencyId, updateData);
    
    return {
      success: true,
      data: updatedAgency,
      message: 'Agency updated successfully'
    };
  }

  @Delete('agencies/:agencyId')
  @ApiOperation({ summary: 'Delete agency (Master Admin only)' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiResponse({ status: 200, description: 'Agency deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @Roles('MASTER_ADMIN')
  @UseGuards(AgencyRoleGuard)
  async deleteAgency(@Param('agencyId') agencyId: string) {
    this.logger.log(`Deleting agency: ${agencyId}`);
    
    await this.enhancedAgencyService.deleteAgency(agencyId);
    
    return {
      success: true,
      message: 'Agency deleted successfully'
    };
  }

  /**
   * Agency-Scoped Endpoints - Tenant-aware operations
   */

  @Get('dashboard')
  @ApiOperation({ summary: 'Get agency dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  @UseGuards(TenantGuard, AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async getAgencyDashboard(@TenantContext() tenantContext: any) {
    this.logger.log(`Retrieving dashboard for agency: ${tenantContext.agencyId}`);
    
    const dashboardData = await this.enhancedAgencyService.getAgencyDashboard(
      tenantContext.agencyId
    );
    
    return {
      success: true,
      data: dashboardData
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get agency swarm status' })
  @ApiResponse({ status: 200, description: 'Swarm status retrieved' })
  @UseGuards(TenantGuard)
  async getAgencySwarmStatus(@TenantContext() tenantContext: any) {
    this.logger.log(`Getting swarm status for agency: ${tenantContext.agencyId}`);
    
    const status = await this.enhancedAgencyService.getAgencySwarmStatus(
      tenantContext.agencyId
    );
    
    return {
      success: true,
      data: status
    };
  }

  @Post('initialize-swarm')
  @ApiOperation({ summary: 'Initialize swarm for agency' })
  @ApiResponse({ status: 200, description: 'Swarm initialized successfully' })
  @UseGuards(TenantGuard, AgencyRoleGuard)
  @Roles('AGENCY_ADMIN')
  async initializeSwarm(
    @TenantContext() tenantContext: any,
    @Body() swarmConfig?: any
  ) {
    this.logger.log(`Initializing swarm for agency: ${tenantContext.agencyId}`);
    
    const result = await this.enhancedAgencyService.initializeSwarmForAgency(
      tenantContext.agencyId,
      swarmConfig
    );
    
    return {
      success: true,
      data: result,
      message: 'Swarm initialized successfully'
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get agency analytics' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 30d, 90d)' })
  @ApiQuery({ name: 'metric', required: false, description: 'Specific metric to retrieve' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved' })
  @UseGuards(TenantGuard, AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async getAgencyAnalytics(
    @TenantContext() tenantContext: any,
    @Query('period') period = '30d',
    @Query('metric') metric?: string
  ) {
    this.logger.log(`Retrieving analytics for agency: ${tenantContext.agencyId}`);
    
    const analytics = await this.enhancedAgencyService.getAgencyAnalytics(
      tenantContext.agencyId,
      { period, metric }
    );
    
    return {
      success: true,
      data: analytics
    };
  }

  @Post('service-requests')
  @ApiOperation({ summary: 'Submit a service request' })
  @ApiResponse({ status: 201, description: 'Service request created' })
  @UseGuards(TenantGuard)
  async submitServiceRequest(
    @TenantContext() tenantContext: any,
    @Body() serviceRequest: any,
    @Request() req: any
  ) {
    this.logger.log(`Submitting service request for agency: ${tenantContext.agencyId}`);
    
    const request = await this.enhancedAgencyService.submitServiceRequest(
      tenantContext.agencyId,
      {
        ...serviceRequest,
        requesterId: req.user?.id
      }
    );
    
    return {
      success: true,
      data: request,
      message: 'Service request submitted successfully'
    };
  }

  @Get('service-requests')
  @ApiOperation({ summary: 'Get agency service requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Service requests retrieved' })
  @UseGuards(TenantGuard)
  async getServiceRequests(
    @TenantContext() tenantContext: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const requests = await this.enhancedAgencyService.getServiceRequests(
      tenantContext.agencyId,
      { status, category, page, limit }
    );
    
    return {
      success: true,
      data: requests
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get agency service providers' })
  @ApiResponse({ status: 200, description: 'Service providers retrieved' })
  @UseGuards(TenantGuard)
  async getServiceProviders(@TenantContext() tenantContext: any) {
    const providers = await this.enhancedAgencyService.getServiceProviders(
      tenantContext.agencyId
    );
    
    return {
      success: true,
      data: providers
    };
  }

  @Post('providers/register')
  @ApiOperation({ summary: 'Register an agent as a service provider' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  @UseGuards(TenantGuard, AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async registerServiceProvider(
    @TenantContext() tenantContext: any,
    @Body() providerData: any
  ) {
    const provider = await this.enhancedAgencyService.registerServiceProvider(
      tenantContext.agencyId,
      providerData
    );
    
    return {
      success: true,
      data: provider,
      message: 'Service provider registered successfully'
    };
  }
}
