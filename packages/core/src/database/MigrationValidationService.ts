import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MigrationValidationService {
  private readonly logger = new Logger(MigrationValidationService.name);
  private readonly DANGEROUS_OPERATIONS_REGEX = [
    /DROP\s+TABLE/i,
    /TRUNCATE\s+TABLE/i,
    /DELETE\s+FROM\s+\w+(?!\s+WHERE)/i, // DELETE without WHERE
    /UPDATE\s+\w+\s+SET\s+(?!\s+WHERE)/i, // UPDATE without WHERE
  ];
  private readonly MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');

  constructor() {}

  async validateMigrations(): Promise<{ valid: boolean; issues: string[] }> {
    this.logger.log('Starting migration validation...');
    const issues: string[] = [];
    let valid = true;

    try {
      const migrationFolders = await this.getMigrationFolders();
      for (const folder of migrationFolders) {
        const migrationFile = path.join(folder, 'migration.sql');
        try {
          const content = await fs.readFile(migrationFile, 'utf-8');
          const detectedIssues = this.checkForDangerousOperations(content, path.basename(folder));
          if (detectedIssues.length > 0) {
            valid = false;
            issues.push(...detectedIssues);
          }
        } catch (error) {
          if (error.code !== 'ENOENT') { // Ignore if migration.sql doesn't exist
            throw error;
          }
        }
      }

      if (valid) {
        this.logger.log('All migration files passed validation.');
      } else {
        this.logger.warn('Migration validation found potential issues:', issues);
      }
      return { valid, issues };
    } catch (error) {
      this.logger.error('Error during migration validation:', error.stack);
      return { valid: false, issues: ['An unexpected error occurred during validation.'] };
    }
  }

  private async getMigrationFolders(): Promise<string[]> {
    const entries = await fs.readdir(this.MIGRATIONS_DIR, { withFileTypes: true });
    return entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(this.MIGRATIONS_DIR, dirent.name));
  }

  private checkForDangerousOperations(sql: string, migrationName: string): string[] {
    const issues: string[] = [];
    for (const regex of this.DANGEROUS_OPERATIONS_REGEX) {
      if (regex.test(sql)) {
        issues.push(`[${migrationName}] Potentially dangerous operation detected: ${regex.source}`);
      }
    }
    return issues;
  }
}
