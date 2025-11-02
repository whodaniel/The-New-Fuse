/**
 * Service Routing Controller
 * Handles service category management, provider routing, and service requests
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
  HttpCode,
  HttpStatus,
  Logger,
} from /@nestjs/common'';
} from /@nestjs/swagger';
import { TenantGuard } from /../guards/tenant.'guard';
import { AgencyRoleGuard } from /../guards/agency-role.'guard';
import { Roles } from /../decorators/roles.'decorator';
import { TenantContext } from /../decorators/tenant-context.'decorator';
@ApiTags('Service Routing'
  @Get('categories'
  @ApiOperation({ summary:Get available service categories'
  @ApiQuery({ name: 'parentId', required: false, description: Filter by parent 'category'
  @ApiQuery({ name: 'tier', required: false, description: Filter by agency 'tier'
  @ApiResponse({ status: 200, description:Service categories retrieved'
    @Query('parentId'
    @Query('tier'
  @Get(/categories/:categoryId'
  @ApiOperation({ summary:Get specific service category details'
  @ApiParam({ name: 'categoryId', description: Category 'ID'
  @ApiResponse({ status: 200, description:Category details retrieved'
    @Param('categoryId'
  @Post('categories'
  @ApiOperation({ summary:Create a new service category'
  @ApiResponse({ status: 201, description:Category created successfully'
  @Roles('AGENCY_ADMIN'
      complexity:SIMPLE' | 'MODERATE' | COMPL'EX' | 'EXPERT'
        type:FIXED' | HOURLY' | TOKEN_BASED'
      message:Service category created successfully'
  @Put(/categories/:categoryId'
  @ApiOperation({ summary:Update service category'
  @ApiParam({ name: 'categoryId', description: Category 'ID'
  @ApiResponse({ status: 200, description:Category updated successfully'
  @Roles('AGENCY_ADMIN'
    @Param('categoryId'
  @Get('providers'
  @ApiOperation({ summary:Get service providers'
  @ApiQuery({ name: 'categoryId', required: false, description: Filter by 'category'
  @ApiQuery({ name: 'capability', required: false, description: Filter by 'capability'
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: Minimum 'rating'
  @ApiResponse({ status: 200, description:Providers retrieved successfully'
    @Query('categoryId'
    @Query('capability'
    @Query('minRating'
  @Get(/providers/:providerId'
  @ApiOperation({ summary:Get specific provider details'
  @ApiParam({ name: 'providerId', description: Provider 'ID'
  @ApiResponse({ status: 200, description:Provider details retrieved'
    @Param('providerId'
  @Post(/providers/register'
  @ApiOperation({ summary:Register an agent as a service provider'
  @ApiResponse({ status: 201, description:Provider registered successfully'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
      message:Service provider registered successfully'
  @Put(/providers/:providerId'
  @ApiOperation({ summary:Update service provider'
  @ApiParam({ name: 'providerId', description: Provider 'ID'
  @ApiResponse({ status: 200, description:Provider updated successfully'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
    @Param('providerId'
  @Post('requests'
  @ApiOperation({ summary:Submit a service request'
  @ApiResponse({ status: 201, description:Service request submitted'
      priority:LOW' | MEDIUM' | HIGH' | URGENT'
      message:Service request submitted successfully'
  @Get('requests'
  @ApiOperation({ summary:Get service requests'
  @ApiQuery({ name: 'status'
  @ApiQuery({ name: 'categoryId'
  @ApiQuery({ name: 'providerId'
  @ApiQuery({ name: 'page'
  @ApiQuery({ name: 'limit'
  @ApiResponse({ status: 200, description: Service requests 'retrieved'
    @Query('status'
    @Query('categoryId'
    @Query('providerId'
    @Query('page'
    @Query('limit'
  @Get(/requests/:requestId'
  @ApiOperation({ summary:Get specific service request'
  @ApiParam({ name: 'requestId', description: Request 'ID'
  @ApiResponse({ status: 200, description:Request details retrieved'
    @Param('requestId'
  @Put(/requests/:requestId/assign'
  @ApiOperation({ summary:Assign provider to service request'
  @ApiParam({ name: 'requestId', description: Request 'ID'
  @ApiResponse({ status: 200, description:Provider assigned successfully'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
    @Param('requestId'
      message:Provider assigned successfully'
  @Put(/requests/:requestId/complete'
  @ApiOperation({ summary:Mark service request as completed'
  @ApiParam({ name: 'requestId', description: Request 'ID'
  @ApiResponse({ status: 200, description:Request marked as completed'
    @Param('requestId'
  @Post('match-providers'
  @ApiOperation({ summary:Find matching providers for requirements'
  @ApiResponse({ status: 200, description:Matching providers found'
      complexity:SIMPLE' | 'MODERATE' | COMPL'EX' | 'EXPERT'
  @Get(/recommendations/:categoryId'
  @ApiOperation({ summary:Get provider recommendations for category'
  @ApiParam({ name: 'categoryId', description: Category 'ID'
  @ApiResponse({ status: 200, description:Recommendations retrieved'
    @Param('')
  @Get(/analytics/categories'
  @ApiOperation({ summary:Get category performance analytics'
  @ApiQuery({ name: 'period'
  @ApiResponse({ status: 200, description: Category analytics 'retrieved'
    @Query('period') period = 30'd';
  @Get(/analytics/providers'
  @ApiOperation({ summary:Get provider performance analytics'
  @ApiQuery({ name: 'providerId'
  @ApiQuery({ name: 'period'
  @ApiResponse({ status: 200, description:Provider analytics retrieved'
    @Query('providerId'
    @Query('period') period = 30';