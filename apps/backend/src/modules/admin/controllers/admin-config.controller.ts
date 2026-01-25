import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { User } from '../../../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { ConfigurationService } from '../../configuration/configuration.service';

@ApiTags('admin')
@Controller('admin/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminConfigController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'List all system configurations' })
  async getAllConfigs() {
    return this.configService.findAllConfigs();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get configuration by key' })
  async getConfigByKey(@Param('key') key: string) {
    return this.configService.findConfigByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update configuration key' })
  async updateConfig(@Param('key') key: string, @Body('value') value: string, @User() user: any) {
    return this.configService.updateConfig(key, value, user?.id);
  }
}
