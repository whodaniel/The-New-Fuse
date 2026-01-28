import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@the-new-fuse/types';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfImprovementCronService } from './self-improvement-cron.service';

@ApiTags('Self Improvement')
@Controller('self-improvement')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SelfImprovementController {
  constructor(private readonly service: SelfImprovementCronService) {}

  @Post('trigger/patterns')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Trigger pattern extraction immediately' })
  async triggerPatternExtraction() {
    await this.service.patternExtraction();
    return { success: true, message: 'Pattern extraction triggered' };
  }

  @Post('trigger/daily')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Trigger daily self-improvement immediately' })
  async triggerDailyImprovement() {
    await this.service.dailySelfImprovement();
    return { success: true, message: 'Daily self-improvement triggered' };
  }

  @Post('trigger/health')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Trigger health monitoring immediately' })
  async triggerHealthMonitoring() {
    await this.service.healthMonitoring();
    return { success: true, message: 'Health monitoring triggered' };
  }
}
