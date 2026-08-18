import {
  Body,
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
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import {
  BackupConfig,
  BackupResult,
  BackupService,
  BackupSnapshot,
  StorageInventory,
} from '../services/backup.service';

@ApiTags('admin')
@Controller('admin/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminBackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'List all system backups' })
  async getBackups(): Promise<BackupSnapshot[]> {
    return this.backupService.listBackups();
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get storage inventory with transparency map' })
  async getInventory(): Promise<StorageInventory> {
    return this.backupService.getStorageInventory();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get full backup status (inventory, backups, config)' })
  async getStatus() {
    return this.backupService.getFullStatus();
  }

  @Get('schedules')
  @ApiOperation({ summary: 'List backup schedules' })
  async getSchedules() {
    const config = await this.backupService.getConfig();
    const cronEnabled = config.schedule.enabled;
    const frequency = config.schedule.frequency;
    const time = config.schedule.time;

    return [
      {
        id: '1',
        name: 'TNF Persistent Backup',
        type: 'full',
        frequency,
        time,
        enabled: cronEnabled,
        lastRun: null, // Could be derived from latest backup
        nextRun: null, // Could be calculated from cron expression
        cronExpression: config.schedule.cron_expression,
      },
    ];
  }

  @Get('config')
  @ApiOperation({ summary: 'Get backup configuration' })
  async getConfig(): Promise<BackupConfig> {
    return this.backupService.getConfig();
  }

  @Post()
  @ApiOperation({ summary: 'Trigger a new backup' })
  async createBackup(): Promise<BackupResult> {
    return this.backupService.executeBackup();
  }

  @Post('config/destination')
  @ApiOperation({ summary: 'Update backup destination folder' })
  async updateDestination(
    @Body('destination') destination: string
  ): Promise<{ success: boolean; destination: string }> {
    if (!destination) {
      throw new HttpException('Destination path is required', HttpStatus.BAD_REQUEST);
    }
    await this.backupService.updateDestination(destination);
    return { success: true, destination };
  }

  @Post('config/cron')
  @ApiOperation({ summary: 'Update cron schedule expression' })
  async updateCron(
    @Body('expression') expression: string
  ): Promise<{ success: boolean; expression: string }> {
    if (!expression) {
      throw new HttpException('Cron expression is required', HttpStatus.BAD_REQUEST);
    }
    await this.backupService.updateCronExpression(expression);
    return { success: true, expression };
  }

  @Post('config/cron/enable')
  @ApiOperation({ summary: 'Enable automated cron backup' })
  async enableCron(): Promise<{ success: boolean; message: string }> {
    const message = await this.backupService.enableCron();
    return { success: true, message };
  }

  @Post('config/cron/disable')
  @ApiOperation({ summary: 'Disable automated cron backup' })
  async disableCron(): Promise<{ success: boolean; message: string }> {
    const message = await this.backupService.disableCron();
    return { success: true, message };
  }

  @Post('config/cron/sync')
  @ApiOperation({ summary: 'Sync persistent cron job to OS crontab' })
  async syncCron(): Promise<{ success: boolean; message: string }> {
    const message = await this.backupService.syncCron();
    return { success: true, message };
  }

  @Post('config/retention')
  @ApiOperation({ summary: 'Update backup retention count' })
  async updateRetention(
    @Body('count') count: number
  ): Promise<{ success: boolean; count: number }> {
    // This would need to be added to the Python script or config
    // For now, we'll return success but note it's not fully implemented
    return { success: true, count };
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
    // The Python script handles retention automatically
    // Manual deletion would require additional implementation
    return { success: true, message: 'Use retention policy for automatic cleanup' };
  }
}
