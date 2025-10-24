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
} from /@nestjs/common'';
} from /@nestjs/swagger';
import { TenantGuard } from /../guards/tenant.'guard';
import { AgencyRoleGuard } from /../guards/agency-role.'guard';
import { Roles } from /../decorators/roles.'decorator';
import { TenantContext } from /../decorators/tenant-context.'decorator';
@ApiTags('Agency Hub'
  @Post('agencies'
  @ApiOperation({ summary:Create a new agency (Master Admin only)'
  @ApiResponse({ status: 201, description: Agency created 'successfully'
  @ApiResponse({ status: 400, description:Invalid input data'
  @ApiResponse({ status: 409, description:Subdomain already exists'
  @Roles('MASTER_ADMIN'
        message:Agency created successfully'
  @Get('agencies'
  @ApiOperation({ summary:List all agencies (Master Admin only)'
  @ApiQuery({ name: 'page'
  @ApiQuery({ name: 'limit'
  @ApiQuery({ name: 'tier'
  @ApiQuery({ name: 'status'
  @ApiResponse({ status: 200, description: Agencies retrieved 'successfully'
  @Roles('MASTER_ADMIN'
    @Query('page'
    @Query('limit'
    @Query('tier'
    @Query('status'
    this.logger.log('Retrieving all agencies for master admin'
  @Get(/agencies/:agencyId'
  @ApiOperation({ summary:Get agency details (Master Admin only)'
  @ApiParam({ name: 'agencyId', description:Agency ID'
  @ApiResponse({ status: 200, description:Agency details retrieved'
  @ApiResponse({ status: 404, description:Agency not found'
  @Roles('MASTER_ADMIN'
  async getAgencyById(@Param('agencyId'
  @Put(/agencies/:agencyId'
  @ApiOperation({ summary:Update agency (Master Admin only)'
  @ApiParam({ name: 'agencyId', description:Agency ID'
  @ApiResponse({ status: 200, description:Agency updated successfully'
  @ApiResponse({ status: 404, description:Agency not found'
  @Roles('MASTER_ADMIN'
    @Param('agencyId'
      message:Agency updated successfully'
  @Delete(/agencies/:agencyId'
  @ApiOperation({ summary:Delete agency (Master Admin only)'
  @ApiParam({ name: 'agencyId', description:Agency ID'
  @ApiResponse({ status: 200, description:Agency deleted successfully'
  @ApiResponse({ status: 404, description:Agency not found'
  @Roles('MASTER_ADMIN'
  async deleteAgency(@Param('agencyId'
  @Get('dashboard'
  @ApiOperation({ summary:Get agency dashboard data'
  @ApiResponse({ status: 200, description:Dashboard data retrieved'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
  @Get('status'
  @ApiOperation({ summary:Get agency swarm status'
  @ApiResponse({ status: 200, description:Swarm status retrieved'
  @Post('initialize-swarm'
  @ApiOperation({ summary:Initialize swarm for agency'
  @ApiResponse({ status: 200, description:Swarm initialized successfully'
  @Roles('AGENCY_ADMIN'
      message:Swarm initialized successfully'
  @Get('analytics'
  @ApiOperation({ summary:Get agency analytics'
  @ApiQuery({ name: 'period', required: false, description: Time period (7d, 30d, 90d)'
  @ApiQuery({ name: 'metric', required: false, description: Specific metric to 'retrieve'
  @ApiResponse({ status: 200, description:Analytics data retrieved'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
    @Query('period') period = 30'd';
    @Query('metric'
  @Post('service-requests'
  @ApiOperation({ summary:Submit a service request'
  @ApiResponse({ status: 201, description:Service request created'
      message:Service request submitted successfully'
  @Get('service-requests'
  @ApiOperation({ summary:Get agency service requests'
  @ApiQuery({ name: 'status'
  @ApiQuery({ name: 'category'
  @ApiQuery({ name: 'page'
  @ApiQuery({ name: 'limit'
  @ApiResponse({ status: 200, description:Service requests retrieved'
    @Query('status'
    @Query('category'
    @Query('page'
    @Query('limit'
  @Get('providers'
  @ApiOperation({ summary:Get agency service providers'
  @ApiResponse({ status: 200, description:Service providers retrieved'
  @Post(/providers/register'
  @ApiOperation({ summary:Register an agent as a service provider'
  @ApiResponse({ status: 201, description:Provider registered successfully'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'