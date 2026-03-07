/**
 * Admin Settings Controller
 * Route: admin/settings
 */

import { Body, Controller, Get, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../../modules/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard';
import { AdminConfigurationService } from '../../services/admin-configuration.service';
import { toError } from '../../utils/error';

interface User {
  id: string;
}

@ApiTags('admin')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(private readonly configService: AdminConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings(@Res() res: Response) {
    try {
      const settings = await this.configService.getSettings();
      // If null, return defaults or empty object
      return res.status(200).json(settings || {});
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }

  @Put()
  @ApiOperation({ summary: 'Update system settings' })
  @ApiBody({ schema: { type: 'object' } })
  async updateSettings(@Body() settings: any, @CurrentUser() user: User, @Res() res: Response) {
    try {
      const updated = await this.configService.updateSettings(settings, user.id);
      return res.status(200).json(updated);
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }

  // Also support POST for convenience
  @Post()
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettingsPost(@Body() settings: any, @CurrentUser() user: User, @Res() res: Response) {
    return this.updateSettings(settings, user, res);
  }
}
