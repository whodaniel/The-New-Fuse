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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { ServiceCategoryRouterService } from '../services/service-category-router.service';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { TenantContext } from '../decorators/tenant-context.decorator';

@ApiTags('Service Routing')
@Controller('api/services')
@UseGuards(TenantGuard)
export class ServiceRoutingController {
  private readonly logger = new Logger(ServiceRoutingController.name);

  constructor(
    private readonly serviceRouter: ServiceCategoryRouterService
  ) {}

  /**
   * Service Category Management
   */

  @Get('categories')
  @ApiOperation({ summary: 'Get available service categories' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent category' })
  @ApiQuery({ name: 'tier', required: false, description: 'Filter by agency tier' })
  @ApiResponse({ status: 200, description: 'Service categories retrieved' })
  async getServiceCategories(
    @TenantContext() tenantContext: any,
    @Query('parentId') parentId?: string,
    @Query('tier') tier?: string
  ) {
    const categories = await this.serviceRouter.getServiceCategories(
      tenantContext.agencyId,
      { parentId, tier }
    );

    return {
      success: true,
      data: categories
    };
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'Get specific service category details' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category details retrieved' })
  async getServiceCategory(
    @TenantContext() tenantContext: any,
    @Param('categoryId') categoryId: string
  ) {
    const category = await this.serviceRouter.getServiceCategoryById(
      tenantContext.agencyId,
      categoryId
    );

    return {
      success: true,
      data: category
    };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new service category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createServiceCategory(
    @TenantContext() tenantContext: any,
    @Body() categoryData: {
      name: string;
      description: string;
      parentId?: string;
      complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXPERT';
      estimatedDuration: number;
      basePricing: {
        type: 'FIXED' | 'HOURLY' | 'TOKEN_BASED';
        amount: number;
      };
      requiredCapabilities: string[];
      maxRetries: number;
    }
  ) {
    const category = await this.serviceRouter.createServiceCategory(
      tenantContext.agencyId,
      categoryData
    );

    return {
      success: true,
      data: category,
      message: 'Service category created successfully'
    };
  }

  @Put('categories/:categoryId')
  @ApiOperation({ summary: 'Update service category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN')
  async updateServiceCategory(
    @TenantContext() tenantContext: any,
    @Param('categoryId') categoryId: string,
    @Body() updateData: any
  ) {
    const category = await this.serviceRouter.updateServiceCategory(
      tenantContext.agencyId,
      categoryId,
      updateData
    );

    return {
      success: true,
      data: category,
      message: 'Service category updated successfully'
    };
  }

  /**
   * Provider Management
   */

  @Get('providers')
  @ApiOperation({ summary: 'Get service providers' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'capability', required: false, description: 'Filter by capability' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Minimum rating' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getServiceProviders(
    @TenantContext() tenantContext: any,
    @Query('categoryId') categoryId?: string,
    @Query('capability') capability?: string,
    @Query('minRating') minRating?: number
  ) {
    const providers = await this.serviceRouter.getServiceProviders(
      tenantContext.agencyId,
      { categoryId, capability, minRating }
    );

    return {
      success: true,
      data: providers
    };
  }

  @Get('providers/:providerId')
  @ApiOperation({ summary: 'Get specific provider details' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider details retrieved' })
  async getServiceProvider(
    @TenantContext() tenantContext: any,
    @Param('providerId') providerId: string
  ) {
    const provider = await this.serviceRouter.getServiceProviderById(
      tenantContext.agencyId,
      providerId
    );

    return {
      success: true,
      data: provider
    };
  }

  @Post('providers/register')
  @ApiOperation({ summary: 'Register an agent as a service provider' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async registerProvider(
    @TenantContext() tenantContext: any,
    @Body() providerData: {
      agentId: string;
      categories: string[];
      capabilities: string[];
      hourlyRate?: number;
      availability: {
        schedule: any;
        timezone: string;
      };
      maxConcurrentRequests: number;
    }
  ) {
    const provider = await this.serviceRouter.registerServiceProvider(
      tenantContext.agencyId,
      providerData
    );

    return {
      success: true,
      data: provider,
      message: 'Service provider registered successfully'
    };
  }

  @Put('providers/:providerId')
  @ApiOperation({ summary: 'Update service provider' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async updateProvider(
    @TenantContext() tenantContext: any,
    @Param('providerId') providerId: string,
    @Body() updateData: any
  ) {
    const provider = await this.serviceRouter.updateServiceProvider(
      tenantContext.agencyId,
      providerId,
      updateData
    );

    return {
      success: true,
      data: provider,
      message: 'Service provider updated successfully'
    };
  }

  /**
   * Service Request Processing
   */

  @Post('requests')
  @ApiOperation({ summary: 'Submit a service request' })
  @ApiResponse({ status: 201, description: 'Service request submitted' })
  @HttpCode(HttpStatus.CREATED)
  async submitServiceRequest(
    @TenantContext() tenantContext: any,
    @Body() requestData: {
      categoryId: string;
      title: string;
      description: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      deadline?: Date;
      budget?: {
        max: number;
        currency: string;
      };
      requirements: any;
      attachments?: string[];
    }
  ) {
    const request = await this.serviceRouter.submitServiceRequest(
      tenantContext.agencyId,
      {
        ...requestData,
        requesterId: tenantContext.userId
      }
    );

    return {
      success: true,
      data: request,
      message: 'Service request submitted successfully'
    };
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get service requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Service requests retrieved' })
  async getServiceRequests(
    @TenantContext() tenantContext: any,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('providerId') providerId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const requests = await this.serviceRouter.getServiceRequests(
      tenantContext.agencyId,
      { status, categoryId, providerId, page, limit }
    );

    return {
      success: true,
      data: requests
    };
  }

  @Get('requests/:requestId')
  @ApiOperation({ summary: 'Get specific service request' })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request details retrieved' })
  async getServiceRequest(
    @TenantContext() tenantContext: any,
    @Param('requestId') requestId: string
  ) {
    const request = await this.serviceRouter.getServiceRequestById(
      tenantContext.agencyId,
      requestId
    );

    return {
      success: true,
      data: request
    };
  }

  @Put('requests/:requestId/assign')
  @ApiOperation({ summary: 'Assign provider to service request' })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Provider assigned successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async assignProvider(
    @TenantContext() tenantContext: any,
    @Param('requestId') requestId: string,
    @Body() assignmentData: {
      providerId: string;
      estimatedCompletion?: Date;
      agreedPrice?: number;
    }
  ) {
    const request = await this.serviceRouter.assignProviderToRequest(
      tenantContext.agencyId,
      requestId,
      assignmentData
    );

    return {
      success: true,
      data: request,
      message: 'Provider assigned successfully'
    };
  }

  @Put('requests/:requestId/complete')
  @ApiOperation({ summary: 'Mark service request as completed' })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request marked as completed' })
  async completeServiceRequest(
    @TenantContext() tenantContext: any,
    @Param('requestId') requestId: string,
    @Body() completionData: {
      result: any;
      deliverables?: string[];
      notes?: string;
    }
  ) {
    const request = await this.serviceRouter.completeServiceRequest(
      tenantContext.agencyId,
      requestId,
      completionData
    );

    return {
      success: true,
      data: request,
      message: 'Service request completed successfully'
    };
  }

  /**
   * Provider Matching and Recommendations
   */

  @Post('match-providers')
  @ApiOperation({ summary: 'Find matching providers for requirements' })
  @ApiResponse({ status: 200, description: 'Matching providers found' })
  async matchProviders(
    @TenantContext() tenantContext: any,
    @Body() requirements: {
      categoryId: string;
      requiredCapabilities: string[];
      budget?: number;
      deadline?: Date;
      complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXPERT';
      priorityFactors?: {
        cost: number;
        quality: number;
        speed: number;
      };
    }
  ) {
    const matches = await this.serviceRouter.findMatchingProviders(
      tenantContext.agencyId,
      requirements
    );

    return {
      success: true,
      data: matches
    };
  }

  @Get('recommendations/:categoryId')
  @ApiOperation({ summary: 'Get provider recommendations for category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved' })
  async getProviderRecommendations(
    @TenantContext() tenantContext: any,
    @Param('categoryId') categoryId: string
  ) {
    const recommendations = await this.serviceRouter.getProviderRecommendations(
      tenantContext.agencyId,
      categoryId
    );

    return {
      success: true,
      data: recommendations
    };
  }

  /**
   * Analytics and Performance
   */

  @Get('analytics/categories')
  @ApiOperation({ summary: 'Get category performance analytics' })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Category analytics retrieved' })
  async getCategoryAnalytics(
    @TenantContext() tenantContext: any,
    @Query('period') period = '30d'
  ) {
    const analytics = await this.serviceRouter.getCategoryAnalytics(
      tenantContext.agencyId,
      period
    );

    return {
      success: true,
      data: analytics
    };
  }

  @Get('analytics/providers')
  @ApiOperation({ summary: 'Get provider performance analytics' })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Provider analytics retrieved' })
  async getProviderAnalytics(
    @TenantContext() tenantContext: any,
    @Query('providerId') providerId?: string,
    @Query('period') period = '30d'
  ) {
    const analytics = await this.serviceRouter.getProviderAnalytics(
      tenantContext.agencyId,
      { providerId, period }
    );

    return {
      success: true,
      data: analytics
    };
  }
}
