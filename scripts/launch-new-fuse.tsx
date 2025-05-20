import { exec } from 'child_process';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';
import { WorkspaceConfig } from '@the-new-fuse/types';
import { MonitoringService } from '@the-new-fuse/core';

class NewFuseLauncher {
  private logger: Logger;
  private redis: Redis;
  private monitoring: MonitoringService;

  constructor() {
    this.logger = new Logger('NewFuseLauncher');
    this.redis = new Redis();
    this.monitoring = new MonitoringService();
  }

  async launch(): Promise<void> {
    try {
      // 1. Check Redis
      await this.verifyRedis();

      // 2. Build required packages in correct order
      await this.buildWorkspacePackages();

      // 3. Start services
      await Promise.all([
        this.startService('api'),
        this.startService('frontend'),
        this.startService('trae-agent')
      ]);

      // 4. Setup monitoring
      await this.setupMonitoring();

      this.logger.log('The New Fuse system is now running');

    } catch (error) {
      this.logger.error('Failed to launch The New Fuse:', error.message);
      process.exit(1);
    }
  }

  private async verifyRedis(): Promise<void> {
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') throw new Error('Redis not responding correctly');
      this.logger.log('Redis connection verified');
    } catch (error) {
      throw new Error(`Redis verification failed: ${error.message}`);
    }
  }

  private async buildWorkspacePackages(): Promise<void> {
    const buildOrder = [
      '@the-new-fuse/types',
      '@the-new-fuse/utils',
      '@the-new-fuse/core',
      '@the-new-fuse/database',
      '@the-new-fuse/feature-tracker',
      '@the-new-fuse/feature-suggestions'
    ];

    for (const pkg of buildOrder) {
      this.logger.log(`Building ${pkg}...`);
      await this.execCommand(`yarn workspace ${pkg} build`);
    }
  }

  private async startService(service: string): Promise<void> {
    const command = `yarn workspace @the-new-fuse/${service} dev`;
    return this.execCommand(command);
  }

  private async execCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Command failed: ${command}`);
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private async setupMonitoring(): Promise<void> {
    const channels = [
      'agent:trae',
      'agent:augment',
      'agent:broadcast',
      'agent:heartbeat',
      'monitoring:metrics',
      'monitoring:alerts'
    ];

    await this.monitoring.initialize(channels);
    this.logger.log('Monitoring system initialized');
  }
}

// Launch the system
const launcher = new NewFuseLauncher();
launcher.launch().catch((error) => {
  console.error('Launch failed:', error);
  process.exit(1);
});
