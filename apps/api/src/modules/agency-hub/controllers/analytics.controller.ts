import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgencyAnalyticsService } from '../services/agency-analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly agencyAnalyticsService: AgencyAnalyticsService) {}

  @Get(':agencyId/overview')
  @ApiOperation({ summary: 'Get comprehensive agency analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics overview retrieved' })
  async getAnalyticsOverview(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d'
  ) {
    return this.agencyAnalyticsService.getOverview(agencyId, timeframe);
  }

  @Get(':agencyId/performance')
  @ApiOperation({ summary: 'Get detailed performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  async getPerformanceMetrics(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '7d',
    @Query('granularity') _granularity: string = 'hour'
  ) {
    return this.agencyAnalyticsService.getPerformance(agencyId, timeframe);
  }

  @Get(':agencyId/providers/performance')
  @ApiOperation({ summary: 'Get provider performance analytics' })
  @ApiResponse({ status: 200, description: 'Provider performance retrieved' })
  async getProviderPerformance(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d',
    @Query('categoryId') _categoryId?: string
  ) {
    return this.agencyAnalyticsService.getProviderPerformance(agencyId, timeframe);
  }

  @Get(':agencyId/quality-trends')
  @ApiOperation({ summary: 'Get quality trend analysis' })
  @ApiResponse({ status: 200, description: 'Quality trends retrieved' })
  async getQualityTrends(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '90d',
    @Query('breakdown') _breakdown: string = 'category'
  ) {
    return this.agencyAnalyticsService.getQualityTrends(agencyId, timeframe);
  }
}
