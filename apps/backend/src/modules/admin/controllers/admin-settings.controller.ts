import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/roles.guard.js';
import { ConfigurationService } from '../../configuration/configuration.service.js';

@ApiTags('admin')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminSettingsController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'Get application settings' })
  async getSettings() {
    return this.configService.getAdminSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update application settings' })
  async updateSettings(@Body() settings: any, @CurrentUser() user: any) {
    return this.configService.updateAdminSettings(settings, user?.id);
  }
}
