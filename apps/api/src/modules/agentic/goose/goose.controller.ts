import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthLevel, RequireAuthLevel } from '../../../guards/secure-auth.guard.js';
import { GooseDispatchDto } from './goose.dto.js';
import { GooseService } from './goose.service.js';

type GooseRequest = Request & {
  user?: {
    id?: string;
    email?: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
};

@ApiTags('agentic-goose')
@Controller('agentic/goose')
@RequireAuthLevel(AuthLevel.USER)
export class GooseController {
  constructor(private readonly gooseService: GooseService) {}

  @Get('access')
  @ApiOperation({ summary: 'Resolve Goose dispatch eligibility for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Goose access policy evaluated' })
  async getAccess(@Req() req: GooseRequest) {
    return this.gooseService.getAccess(req.user || {});
  }

  @Post('dispatch')
  @ApiOperation({ summary: 'Dispatch a Goose CLI run under role/membership policy' })
  @ApiResponse({ status: 201, description: 'Goose job dispatched' })
  async dispatch(@Body() body: GooseDispatchDto, @Req() req: GooseRequest) {
    return this.gooseService.dispatch(body, req.user || {});
  }
}
