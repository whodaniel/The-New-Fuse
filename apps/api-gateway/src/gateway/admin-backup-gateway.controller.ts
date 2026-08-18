import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

@ApiTags('admin-backups')
@Controller('admin/backups')
export class AdminBackupGatewayController {
  private readonly repoRoot: string;
  private readonly scriptPath: string;

  constructor() {
    this.repoRoot = path.resolve(__dirname, '../../../..');
    this.scriptPath = path.join(this.repoRoot, 'scripts', 'autonomy', 'tnf_backup_cron.py');
    if (!fs.existsSync(this.scriptPath)) {
      let cursor = path.resolve(__dirname);
      for (let i = 0; i < 10; i++) {
        const candidate = path.join(cursor, 'scripts', 'autonomy', 'tnf_backup_cron.py');
        if (fs.existsSync(candidate)) {
          this.scriptPath = candidate;
          this.repoRoot = cursor;
          break;
        }
        cursor = path.dirname(cursor);
      }
    }
  }

  private async run(args: string[]): Promise<string> {
    if (!fs.existsSync(this.scriptPath)) {
      throw new HttpException('Backup script not found', HttpStatus.SERVICE_UNAVAILABLE);
    }
    try {
      const { stdout } = await execFileAsync('python3', [this.scriptPath, ...args], {
        cwd: this.repoRoot,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120_000,
      });
      return String(stdout || '').trim();
    } catch (error: any) {
      throw new HttpException(
        error?.stderr || error?.message || 'Backup script failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'List backup snapshots' })
  async list() {
    return JSON.parse(await this.run(['--list-backups']));
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Storage inventory' })
  async inventory() {
    return JSON.parse(await this.run(['--inventory']));
  }

  @Get('status')
  @ApiOperation({ summary: 'Full backup status' })
  async status() {
    return JSON.parse(await this.run([]));
  }

  @Get('config')
  @ApiOperation({ summary: 'Backup configuration' })
  async config() {
    const data = JSON.parse(await this.run([]));
    return data.config;
  }

  @Post()
  @ApiOperation({ summary: 'Execute a backup now' })
  async create() {
    return JSON.parse(await this.run(['--execute-backup']));
  }

  @Post('config/destination')
  async setDestination(@Body('destination') destination: string) {
    if (!destination) throw new HttpException('destination required', HttpStatus.BAD_REQUEST);
    await this.run(['--set-dest', destination]);
    return { success: true, destination };
  }

  @Post('config/cron')
  async setCron(@Body('expression') expression: string) {
    if (!expression) throw new HttpException('expression required', HttpStatus.BAD_REQUEST);
    await this.run(['--set-cron', expression]);
    return { success: true, expression };
  }

  @Post('config/cron/enable')
  async enable() {
    return { success: true, message: await this.run(['--enable-cron']) };
  }

  @Post('config/cron/disable')
  async disable() {
    return { success: true, message: await this.run(['--disable-cron']) };
  }

  @Post('config/cron/sync')
  async sync() {
    return { success: true, message: await this.run(['--sync-cron']) };
  }
}
