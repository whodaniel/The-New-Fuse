import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthLevel, RequireAuthLevel, SecureAuthGuard } from '../../../guards/secure-auth.guard.js';
// import { ServiceCategoryRouterService } from '../../../types/core/services/service-category-router.service.js';
// import { EnhancedAgencyService } from '../../../types/core/services/enhanced-agency.service.js';
// import { AuthGuard } from '../../../guards/auth.guard.js';
// import { RolesGuard } from '../../../guards/roles.guard.js';
// import { Roles } from '../../../decorators/roles.decorator.js';
// import { CurrentUser } from '../../../decorators/current-user.decorator.js';

@ApiTags('service-requests')
@Controller('service-requests')
@UseGuards(SecureAuthGuard)
@RequireAuthLevel(AuthLevel.USER)
@ApiBearerAuth()
export class ServiceRequestController {
  // constructor(
  //   private readonly serviceCategoryRouter: ServiceCategoryRouterService,
  //   private readonly enhancedAgencyService: EnhancedAgencyService
  // ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new service request' })
  @ApiResponse({ status: 201, description: 'Service request created' })
  async createServiceRequest(
    @Body() requestDto: any
    // @CurrentUser() user: any
  ) {
    this.notImplemented('Create service request');
  }

  @Get()
  @ApiOperation({ summary: 'Get service requests for agency' })
  @ApiResponse({ status: 200, description: 'Service requests retrieved' })
  async getServiceRequests(
    @Query('agencyId') agencyId: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('providerId') providerId?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0
    // @CurrentUser() user: any
  ) {
    this.notImplemented('List service requests');
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'Get specific service request details' })
  @ApiResponse({ status: 200, description: 'Service request details retrieved' })
  async getServiceRequest(@Param('requestId') requestId: string) {
    this.notImplemented('Get service request');
  }

  @Put(':requestId/status')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Update service request status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateRequestStatus(@Param('requestId') requestId: string, @Body() statusDto: any) {
    this.notImplemented('Update service request status');
  }

  @Post(':requestId/assign')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Assign service request to provider' })
  @ApiResponse({ status: 200, description: 'Request assigned successfully' })
  async assignRequest(@Param('requestId') requestId: string, @Body() assignmentDto: any) {
    this.notImplemented('Assign service request');
  }

  @Post(':requestId/auto-assign')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Auto-assign service request to best provider' })
  @ApiResponse({ status: 200, description: 'Request auto-assigned successfully' })
  async autoAssignRequest(@Param('requestId') requestId: string) {
    this.notImplemented('Auto-assign service request');
  }

  @Get(':requestId/recommendations')
  @ApiOperation({ summary: 'Get provider recommendations for request' })
  @ApiResponse({ status: 200, description: 'Provider recommendations retrieved' })
  async getProviderRecommendations(@Param('requestId') requestId: string) {
    this.notImplemented('Provider recommendations');
  }

  @Post(':requestId/complete')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENT_OPERATOR)
  @ApiOperation({ summary: 'Mark service request as completed' })
  @ApiResponse({ status: 200, description: 'Request marked as completed' })
  async completeRequest(@Param('requestId') requestId: string, @Body() completionDto: any) {
    this.notImplemented('Complete service request');
  }

  @Post(':requestId/review')
  @ApiOperation({ summary: 'Submit review for completed service request' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async submitReview(
    @Param('requestId') requestId: string,
    @Body() reviewDto: any
    // @CurrentUser() user: any
  ) {
    this.notImplemented('Submit service request review');
  }

  @Get('categories/:categoryId/requests')
  @ApiOperation({ summary: 'Get requests by service category' })
  @ApiResponse({ status: 200, description: 'Category requests retrieved' })
  async getRequestsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('agencyId') agencyId: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0
  ) {
    this.notImplemented('Category service requests');
  }

  private notImplemented(feature: string): never {
    throw new HttpException(
      `${feature} is not implemented in this deployment.`,
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}
