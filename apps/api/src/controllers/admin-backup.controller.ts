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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { BackupCronService } from '../services/backup-cron.service';

@ApiTags('admin-backups')
@Controller('admin/backups')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminBackupController {
  constructor(private readonly backupService: BackupCronService) {}

  @Get()
  @ApiOperation({ summary: 'List all system backups' })
  async getBackups() {
    return this.backupService.listBackups();
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get storage inventory with transparency map' })
  async getInventory() {
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
    return [
      {
        id: '1',
        name: 'TNF Persistent Backup',
        type: 'full',
        frequency: config.schedule.frequency,
        time: config.schedule.time,
        enabled: config.schedule.enabled,
        lastRun: null,
        nextRun: null,
        cronExpression: config.schedule.cron_expression,
      },
    ];
  }

  @Get('config')
  @ApiOperation({ summary: 'Get backup configuration' })
  async getConfig() {
    return this.backupService.getConfig();
  }

  @Post()
  @ApiOperation({ summary: 'Trigger a new backup' })
  async createBackup() {
    return this.backupService.executeBackup();
  }

  @Post('config/destination')
  @ApiOperation({ summary: 'Update backup destination folder' })
  async updateDestination(@Body('destination') destination: string) {
    if (!destination) {
      throw new HttpException('Destination path is required', HttpStatus.BAD_REQUEST);
    }
    await this.backupService.updateDestination(destination);
    return { success: true, destination };
  }

  @Post('config/cron')
  @ApiOperation({ summary: 'Update cron schedule expression' })
  async updateCron(@Body('expression') expression: string) {
    if (!expression) {
      throw new HttpException('Cron expression is required', HttpStatus.BAD_REQUEST);
    }
    await this.backupService.updateCronExpression(expression);
    return { success: true, expression };
  }

  @Post('config/cron/enable')
  @ApiOperation({ summary: 'Enable automated cron backup' })
  async enableCron() {
    const message = await this.backupService.enableCron();
    return { success: true, message };
  }

  @Post('config/cron/disable')
  @ApiOperation({ summary: 'Disable automated cron backup' })
  async disableCron() {
    const message = await this.backupService.disableCron();
    return { success: true, message };
  }

  @Post('config/cron/sync')
  @ApiOperation({ summary: 'Sync persistent cron job to OS crontab' })
  async syncCron() {
    const message = await this.backupService.syncCron();
    return { success: true, message };
  }

  @Post('config/retention')
  @ApiOperation({ summary: 'Update backup retention count' })
  async updateRetention(@Body('count') count: number) {
    return { success: true, count };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a backup' })
  async restoreBackup(@Param('id') _id: string) {
    throw new HttpException(
      'Restore functionality not implemented yet',
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a backup' })
  async deleteBackup(@Param('id') _id: string) {
    return { success: true, message: 'Use retention policy for automatic cleanup' };
  }
}
