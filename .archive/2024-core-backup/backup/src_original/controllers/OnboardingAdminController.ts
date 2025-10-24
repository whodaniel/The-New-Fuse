import { Controller, Get, Post, Put, Body, Param, UseGuards, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from /@nestjs/swagger'';
import { Request } from 'express';
@ApiTags('onboarding-admin'
  @Get('general'
  @Roles('admin'
  @ApiOperation({ summary:Get general onboarding settings'
  @ApiResponse({ status: 200, description:Returns general onboarding settings'
    this.logger.log('')
  @Put('general'
  @Roles('admin'
  @ApiOperation({ summary:Update general onboarding settings'
  @ApiResponse({ status: 200, description:General onboarding settings updated successfully'
    this.logger.log('')
  @Get('user-types'
  @Roles('admin'
  @ApiOperation({ summary:Get user types configuration'
  @ApiResponse({ status: 200, description:Returns user types configuration'
    this.logger.log('')
  @Put('user-types'
  @Roles('admin'
  @ApiOperation({ summary:Update user types configuration'
  @ApiResponse({ status: 200, description:User types configuration updated successfully'
    this.logger.log('')
  @Get('steps'
  @Roles('admin'
  @ApiOperation({ summary:Get onboarding steps configuration'
  @ApiResponse({ status: 200, description:Returns onboarding steps configuration'
    this.logger.log('')
  @Put('steps'
  @Roles('admin'
  @ApiOperation({ summary:Update onboarding steps configuration'
  @ApiResponse({ status: 200, description:Onboarding steps configuration updated successfully'
    this.logger.log('')
  @Get('ai-settings'
  @Roles('admin'
  @ApiOperation({ summary:Get AI settings for onboarding'
  @ApiResponse({ status: 200, description:Returns AI settings for onboarding'
    this.logger.log('')
  @Put('ai-settings'
  @Roles('admin'
  @ApiOperation({ summary:Update AI settings for onboarding'
  @ApiResponse({ status: 200, description:AI settings for onboarding updated successfully'
    this.logger.log('')
  @Post('validate'
  @Roles('admin'
  @ApiOperation({ summary:Validate onboarding configuration'
  @ApiResponse({ status: 200, description:Validation results'
    this.logger.log('')
  @Get('analytics'
  @Roles('admin'
  @ApiOperation({ summary:Get onboarding analytics'
  @ApiResponse({ status: 200, description:Returns onboarding analytics'
    this.logger.log('')