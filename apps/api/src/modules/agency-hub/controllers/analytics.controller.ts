import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
import { AgentSwarmOrchestrationService } from '@the-new-fuse/core/services/agent-swarm-orchestration.service';
import { ServiceCategoryRouterService } from '@the-new-fuse/core/services/service-category-router.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(AuthGuard, RolesGuard)
@Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly enhancedAgencyService: EnhancedAgencyService,
    private readonly swarmOrchestrationService: AgentSwarmOrchestrationService,
    private readonly serviceCategoryRouter: ServiceCategoryRouterService
  ) {}

  @Get(':agencyId/overview')
  @ApiOperation({ summary: 'Get comprehensive agency analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics overview retrieved' })
  async getAnalyticsOverview(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d'
  ) {
    try {
      const [
        agencyAnalytics,
        swarmMetrics,
        serviceMetrics
      ] = await Promise.all([
        this.enhancedAgencyService.getAnalytics(agencyId, timeframe),
        this.swarmOrchestrationService.getPerformanceMetrics(agencyId, timeframe),
        this.serviceCategoryRouter.getCategoryPerformance(agencyId, timeframe)
      ]);

      return {
        timeframe,
        generatedAt: new Date().toISOString(),
        agency: agencyAnalytics,
        swarm: swarmMetrics,
        services: serviceMetrics,
        summary: {
          totalExecutions: swarmMetrics.totalExecutions || 0,
          totalRequests: serviceMetrics.totalRequests || 0,
          averageQuality: serviceMetrics.averageQuality || 0,
          providerUtilization: serviceMetrics.providerUtilization || 0,
          clientSatisfaction: serviceMetrics.clientSatisfaction || 0
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get analytics overview',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/performance')
  @ApiOperation({ summary: 'Get detailed performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  async getPerformanceMetrics(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '7d',
    @Query('granularity') granularity: string = 'hour'
  ) {
    try {
      return await this.swarmOrchestrationService.getDetailedMetrics(
        agencyId,
        timeframe,
        granularity
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get performance metrics',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/providers/performance')
  @ApiOperation({ summary: 'Get provider performance analytics' })
  @ApiResponse({ status: 200, description: 'Provider performance retrieved' })
  async getProviderPerformance(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d',
    @Query('categoryId') categoryId?: string
  ) {
    try {
      return await this.serviceCategoryRouter.getProviderPerformance(
        agencyId,
        timeframe,
        categoryId
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get provider performance',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/quality-trends')
  @ApiOperation({ summary: 'Get quality trend analysis' })
  @ApiResponse({ status: 200, description: 'Quality trends retrieved' })
  async getQualityTrends(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '90d',
    @Query('breakdown') breakdown: string = 'category'
  ) {
    try {
      return await this.enhancedAgencyService.getQualityTrends(
        agencyId,
        timeframe,
        breakdown
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get quality trends',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/utilization')
  @ApiOperation({ summary: 'Get resource utilization metrics' })
  @ApiResponse({ status: 200, description: 'Utilization metrics retrieved' })
  async getUtilizationMetrics(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '24h'
  ) {
    try {
      return await this.swarmOrchestrationService.getUtilizationMetrics(
        agencyId,
        timeframe
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get utilization metrics',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/cost-analysis')
  @ApiOperation({ summary: 'Get cost analysis and billing insights' })
  @ApiResponse({ status: 200, description: 'Cost analysis retrieved' })
  async getCostAnalysis(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d',
    @Query('breakdown') breakdown: string = 'category'
  ) {
    try {
      return await this.enhancedAgencyService.getCostAnalysis(
        agencyId,
        timeframe,
        breakdown
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get cost analysis',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/bottlenecks')
  @ApiOperation({ summary: 'Identify performance bottlenecks' })
  @ApiResponse({ status: 200, description: 'Bottleneck analysis retrieved' })
  async getBottleneckAnalysis(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '7d'
  ) {
    try {
      return await this.swarmOrchestrationService.identifyBottlenecks(
        agencyId,
        timeframe
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get bottleneck analysis',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/predictions')
  @ApiOperation({ summary: 'Get predictive analytics and recommendations' })
  @ApiResponse({ status: 200, description: 'Predictions retrieved' })
  async getPredictiveAnalytics(
    @Param('agencyId') agencyId: string,
    @Query('horizon') horizon: string = '30d'
  ) {
    try {
      return await this.enhancedAgencyService.getPredictiveAnalytics(
        agencyId,
        horizon
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get predictive analytics',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data exported' })
  async exportAnalyticsData(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d',
    @Query('format') format: string = 'json',
    @Query('include') include?: string // comma-separated list
  ) {
    try {
      const includeMetrics = include ? include.split(',') : [
        'executions',
        'requests',
        'providers',
        'quality',
        'costs'
      ];

      return await this.enhancedAgencyService.exportAnalyticsData(
        agencyId,
        timeframe,
        format,
        includeMetrics
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to export analytics data',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
