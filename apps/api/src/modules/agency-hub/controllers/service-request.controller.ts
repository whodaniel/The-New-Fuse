import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceCategoryRouterService } from '@the-new-fuse/core/services/service-category-router.service';
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { EnhancedUserRole } from '@prisma/client';

@ApiTags('service-requests')
@Controller('api/service-requests')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ServiceRequestController {
  constructor(
    private readonly serviceCategoryRouter: ServiceCategoryRouterService,
    private readonly enhancedAgencyService: EnhancedAgencyService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new service request' })
  @ApiResponse({ status: 201, description: 'Service request created' })
  async createServiceRequest(
    @Body() requestDto: any,
    @CurrentUser() user: any
  ) {
    try {
      return await this.enhancedAgencyService.submitServiceRequest(
        user.agencyId,
        user.id,
        requestDto
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create service request',
        HttpStatus.BAD_REQUEST
      );
    }
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
    @Query('offset') offset: number = 0,
    @CurrentUser() user: any
  ) {
    try {
      // Use agencyId from user context if not provided
      const targetAgencyId = agencyId || user.agencyId;
      
      return await this.enhancedAgencyService.getServiceRequests(targetAgencyId, {
        status,
        categoryId,
        providerId,
        limit,
        offset
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get service requests',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'Get specific service request details' })
  @ApiResponse({ status: 200, description: 'Service request details retrieved' })
  async getServiceRequest(@Param('requestId') requestId: string) {
    try {
      return await this.enhancedAgencyService.getServiceRequestDetails(requestId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Service request not found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':requestId/status')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Update service request status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateRequestStatus(
    @Param('requestId') requestId: string,
    @Body() statusDto: any
  ) {
    try {
      return await this.enhancedAgencyService.updateServiceRequestStatus(
        requestId,
        statusDto.status,
        statusDto.reason
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update status',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':requestId/assign')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Assign service request to provider' })
  @ApiResponse({ status: 200, description: 'Request assigned successfully' })
  async assignRequest(
    @Param('requestId') requestId: string,
    @Body() assignmentDto: any
  ) {
    try {
      return await this.serviceCategoryRouter.assignRequestToProvider(
        requestId,
        assignmentDto.providerId,
        assignmentDto.priority
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to assign request',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':requestId/auto-assign')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Auto-assign service request to best provider' })
  @ApiResponse({ status: 200, description: 'Request auto-assigned successfully' })
  async autoAssignRequest(@Param('requestId') requestId: string) {
    try {
      const requestDetails = await this.enhancedAgencyService.getServiceRequestDetails(requestId);
      
      const bestProvider = await this.serviceCategoryRouter.findBestProvider(
        requestDetails.categoryId,
        requestDetails.agencyId,
        requestDetails.requirements
      );

      if (!bestProvider) {
        throw new HttpException(
          'No suitable provider found',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.serviceCategoryRouter.assignRequestToProvider(
        requestId,
        bestProvider.id
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to auto-assign request',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':requestId/recommendations')
  @ApiOperation({ summary: 'Get provider recommendations for request' })
  @ApiResponse({ status: 200, description: 'Provider recommendations retrieved' })
  async getProviderRecommendations(@Param('requestId') requestId: string) {
    try {
      const requestDetails = await this.enhancedAgencyService.getServiceRequestDetails(requestId);
      
      return await this.serviceCategoryRouter.getProviderRecommendations(
        requestDetails.categoryId,
        requestDetails.agencyId,
        requestDetails.requirements
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get recommendations',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post(':requestId/complete')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENT_OPERATOR)
  @ApiOperation({ summary: 'Mark service request as completed' })
  @ApiResponse({ status: 200, description: 'Request marked as completed' })
  async completeRequest(
    @Param('requestId') requestId: string,
    @Body() completionDto: any
  ) {
    try {
      return await this.enhancedAgencyService.completeServiceRequest(
        requestId,
        completionDto.deliverables,
        completionDto.qualityScore,
        completionDto.notes
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to complete request',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':requestId/review')
  @ApiOperation({ summary: 'Submit review for completed service request' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async submitReview(
    @Param('requestId') requestId: string,
    @Body() reviewDto: any,
    @CurrentUser() user: any
  ) {
    try {
      return await this.enhancedAgencyService.submitServiceReview(
        requestId,
        user.id,
        reviewDto
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to submit review',
        HttpStatus.BAD_REQUEST
      );
    }
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
    try {
      return await this.serviceCategoryRouter.getRequestsByCategory(
        categoryId,
        agencyId,
        { status, limit, offset }
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get category requests',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
