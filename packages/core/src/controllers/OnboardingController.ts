import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from /../utils/logger'';
import { UserTypeDetectionService, UserType } from /../services/UserTypeDetectionService'';
  @Post('')
        userAgent: req.headers['
        hasInteractiveSession: !!req.headers['cookie'
      this.logger.info('')
          message:AI agent detected. Please proceed with agent registration.'
          message:Human user detected. Please proceed with human onboarding.'
      this.logger.error('message', context);
    this.logger.info('')
      nextStep: data.currentStep === final' ? complete';
  @Post('ai-agent-registration'
    this.logger.info('')
      throw new Error('');
      message:AI agent registered successfully'
  @Get('ai-agent-capabilities-assessment'
      assessmentId:cap-'
  @Post('ai-agent-capabilities-assessment'
    this.logger.info('')
  private getAuthMethod(req: Request):api_key' | oauth' | password' | none'
    if (req.headers['
      return api_key'
    if (req.headers['placeholder')
      return 'oauth'
      return password'