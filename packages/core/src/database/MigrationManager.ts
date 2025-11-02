import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class MigrationManager {
  private readonly logger = new Logger(MigrationManager.name);

  constructor() {}

  async runMigrations(): Promise<{ stdout: string; stderr: string }> {
    this.logger.log('Running database migrations...');
    try {
      const result = await execAsync('pnpm prisma migrate deploy');
      this.logger.log('Migrations applied successfully.');
      this.logger.debug(result.stdout);
      if (result.stderr) {
        this.logger.warn('Migration command produced stderr:', result.stderr);
      }
      return result;
    } catch (error) {
      this.logger.error('Error running migrations:', error.stack);
      throw error;
    }
  }

  async revertLastMigration(): Promise<{ stdout: string; stderr: string }> {
    this.logger.log('Reverting last database migration...');
    try {
      // Note: `migrate reset` is destructive and will delete data.
      // A more sophisticated approach might be needed for production environments.
      const result = await execAsync('pnpm prisma migrate reset --force');
      this.logger.log('Last migration reverted successfully.');
      return result;
    } catch (error) {
      this.logger.error('Error reverting migration:', error.stack);
      throw error;
    }
  }

  async createMigration(name: string): Promise<{ stdout: string; stderr: string }> {
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Invalid migration name. Use only alphanumeric characters, underscores, and hyphens.');
    }
    this.logger.log(`Creating new migration: ${name}`);
    try {
      const result = await execAsync(`pnpm prisma migrate dev --name ${name}`);
      this.logger.log('Migration created successfully.');
      return result;
    } catch (error) {
      this.logger.error('Error creating migration:', error.stack);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<{ stdout: string; stderr: string }> {
    this.logger.log('Checking migration status...');
    try {
      const result = await execAsync('pnpm prisma migrate status');
      this.logger.log('Migration status retrieved.');
      return result;
    } catch (error) {
      this.logger.error('Error getting migration status:', error.stack);
      throw error;
    }
  }
}
