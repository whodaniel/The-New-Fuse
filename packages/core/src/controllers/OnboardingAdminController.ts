import { Controller, Get, Post, Put, Body, Param, UseGuards, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { OnboardingConfigService } from '../services/onboarding-config.service.js';

/**
 * Controller for managing onboarding configuration settings
 */
@ApiTags('onboarding-admin')
@Controller('api/admin/onboarding')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class OnboardingAdminController {
  private readonly logger = new Logger(OnboardingAdminController.name);

  constructor(
    private readonly onboardingConfigService: OnboardingConfigService
  ) {}

  /**
   * Get general onboarding settings
   */
  @Get('general')
  @Roles('admin')
  @ApiOperation({ summary: 'Get general onboarding settings' })
  @ApiResponse({ status: 200, description: 'Returns general onboarding settings' })
  async getGeneralSettings(@Req() req: Request) {
    this.logger.log('Getting general onboarding settings', { userId: req.user?.id });
    return this.onboardingConfigService.getGeneralSettings();
  }

  /**
   * Update general onboarding settings
   */
  @Put('general')
  @Roles('admin')
  @ApiOperation({ summary: 'Update general onboarding settings' })
  @ApiResponse({ status: 200, description: 'General onboarding settings updated successfully' })
  async updateGeneralSettings(@Body() data: any, @Req() req: Request) {
    this.logger.log('Updating general onboarding settings', { userId: req.user?.id });
    return this.onboardingConfigService.updateGeneralSettings(data);
  }

  /**
   * Get user types configuration
   */
  @Get('user-types')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user types configuration' })
  @ApiResponse({ status: 200, description: 'Returns user types configuration' })
  async getUserTypes(@Req() req: Request) {
    this.logger.log('Getting user types configuration', { userId: req.user?.id });
    return this.onboardingConfigService.getUserTypes();
  }

  /**
   * Update user types configuration
   */
  @Put('user-types')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user types configuration' })
  @ApiResponse({ status: 200, description: 'User types configuration updated successfully' })
  async updateUserTypes(@Body() data: any, @Req() req: Request) {
    this.logger.log('Updating user types configuration', { userId: req.user?.id });
    return this.onboardingConfigService.updateUserTypes(data);
  }

  /**
   * Get onboarding steps configuration
   */
  @Get('steps')
  @Roles('admin')
  @ApiOperation({ summary: 'Get onboarding steps configuration' })
  @ApiResponse({ status: 200, description: 'Returns onboarding steps configuration' })
  async getSteps(@Req() req: Request) {
    this.logger.log('Getting onboarding steps configuration', { userId: req.user?.id });
    return this.onboardingConfigService.getSteps();
  }

  /**
   * Update onboarding steps configuration
   */
  @Put('steps')
  @Roles('admin')
  @ApiOperation({ summary: 'Update onboarding steps configuration' })
  @ApiResponse({ status: 200, description: 'Onboarding steps configuration updated successfully' })
  async updateSteps(@Body() data: any, @Req() req: Request) {
    this.logger.log('Updating onboarding steps configuration', { userId: req.user?.id });
    return this.onboardingConfigService.updateSteps(data);
  }

  /**
   * Get AI settings for onboarding
   */
  @Get('ai-settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Get AI settings for onboarding' })
  @ApiResponse({ status: 200, description: 'Returns AI settings for onboarding' })
  async getAISettings(@Req() req: Request) {
    this.logger.log('Getting AI settings for onboarding', { userId: req.user?.id });
    return this.onboardingConfigService.getAISettings();
  }

  /**
   * Update AI settings for onboarding
   */
  @Put('ai-settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update AI settings for onboarding' })
  @ApiResponse({ status: 200, description: 'AI settings for onboarding updated successfully' })
  async updateAISettings(@Body() data: any, @Req() req: Request) {
    this.logger.log('Updating AI settings for onboarding', { userId: req.user?.id });
    return this.onboardingConfigService.updateAISettings(data);
  }

  /**
   * Validate onboarding configuration
   */
  @Post('validate')
  @Roles('admin')
  @ApiOperation({ summary: 'Validate onboarding configuration' })
  @ApiResponse({ status: 200, description: 'Validation results' })
  async validateConfiguration(@Req() req: Request) {
    this.logger.log('Validating onboarding configuration', { userId: req.user?.id });
    return this.onboardingConfigService.validateConfiguration();
  }

  /**
   * Get onboarding analytics
   */
  @Get('analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get onboarding analytics' })
  @ApiResponse({ status: 200, description: 'Returns onboarding analytics' })
  async getAnalytics(@Req() req: Request) {
    this.logger.log('Getting onboarding analytics', { userId: req.user?.id });
    return this.onboardingConfigService.getAnalytics();
  }
}
