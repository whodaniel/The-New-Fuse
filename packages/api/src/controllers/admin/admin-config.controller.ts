/**
 * Admin Configuration Controller
 * Route: admin/config
 */

import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../../modules/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard.js';
import { AdminConfigurationService } from '../../services/admin-configuration.service.js';
import { toError } from '../../utils/error.js';

interface User {
  id: string;
}

@ApiTags('admin')
@Controller('admin/config')
@UseGuards(JwtAuthGuard)
export class AdminConfigController {
  constructor(private readonly configService: AdminConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system configurations' })
  async getConfigs(@Res() res: Response) {
    try {
      const configs = await this.configService.getAllConfigs();
      return res.status(200).json(configs);
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }

  @Post()
  @ApiOperation({ summary: 'Update or create a configuration' })
  @ApiBody({
    schema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } } },
  })
  async updateConfig(
    @Body() body: { key: string; value: string },
    @CurrentUser() user: User,
    @Res() res: Response
  ) {
    try {
      if (!body.key || body.value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
      }
      const config = await this.configService.updateConfig(body.key, body.value, user.id);
      return res.status(200).json(config);
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }
}
