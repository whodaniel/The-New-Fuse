import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { User } from '../../../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { ConfigurationService } from '../../configuration/configuration.service';

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
  async updateSettings(@Body() settings: any, @User() user: any) {
    return this.configService.updateAdminSettings(settings, user?.id);
  }
}
