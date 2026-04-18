import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/roles.guard.js';

@ApiTags('admin')
@Controller('admin/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminBackupController {
  // In-memory mock for now, as we don't have a backup service yet
  // This allows the UI to function without errors, while reflecting "no backups" state
  // or a simulated state for demonstration if requested.
  // Ideally this should connect to a real BackupService.

  @Get()
  @ApiOperation({ summary: 'List all system backups' })
  async getBackups() {
    // Return empty list to reflect "truth" (no backups exist)
    // Or return a "System Snapshot" if one was auto-created
    return [];
  }

  @Get('schedules')
  @ApiOperation({ summary: 'List backup schedules' })
  async getSchedules() {
    // Return default schedules
    return [
      {
        id: '1',
        name: 'Daily Full Backup',
        type: 'full',
        frequency: 'daily',
        time: '02:00',
        enabled: false, // Disabled by default until configured
        lastRun: null,
        nextRun: null,
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: 'Trigger a new backup' })
  async createBackup() {
    // Simulate backup creation
    // In a real implementation, this would trigger a job
    return {
      id: 'new-backup-' + Date.now(),
      status: 'in_progress',
      message: 'Backup started (simulation)',
    };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a backup' })
  async restoreBackup(@Param('id') id: string) {
    throw new HttpException(
      'Restore functionality not implemented yet',
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a backup' })
  async deleteBackup(@Param('id') id: string) {
    return { success: true };
  }
}
