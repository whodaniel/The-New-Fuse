import { Injectable, Logger } from '@nestjs/common';

export interface Migration {
  from: string;
  to: string;
  migrate: (workflow: any) => any;
}

@Injectable()
export class WorkflowVersionManager {
  private readonly logger = new Logger(WorkflowVersionManager.name);
  private readonly migrations = new Map<string, Migration>();

  constructor() {
    this.registerMigrations();
  }

  async migrateWorkflow(workflow: any, targetVersion: string): Promise<any> {
    const currentVersion = workflow.version || '1.0.0';
    
    if (currentVersion === targetVersion) {
      return workflow;
    }

    this.logger.log(`Migrating workflow from ${currentVersion} to ${targetVersion}`);
    
    const migrationPath = this.calculateMigrationPath(currentVersion, targetVersion);
    
    let migratedWorkflow = { ...workflow };

    for (const migration of migrationPath) {
      migratedWorkflow = await this.applyMigration(migratedWorkflow, migration);
    }

    migratedWorkflow.version = targetVersion;
    
    this.logger.log('Workflow migration completed successfully');
    return migratedWorkflow;
  }

  private calculateMigrationPath(from: string, to: string): Migration[] {
    const path: Migration[] = [];
    
    // Simple version comparison - in real implementation, this would be more sophisticated
    const fromParts = from.split('.').map(Number);
    const toParts = to.split('.').map(Number);
    
    if (fromParts[0] < toParts[0]) {
      // Major version upgrade
      path.push(this.migrations.get(`${from}-to-${to}`)!);
    } else if (fromParts[1] < toParts[1]) {
      // Minor version upgrade
      path.push(this.migrations.get(`${from}-to-${to}`)!);
    } else if (fromParts[2] < toParts[2]) {
      // Patch version upgrade
      path.push(this.migrations.get(`${from}-to-${to}`)!);
    }
    
    return path.filter(Boolean);
  }

  private async applyMigration(workflow: any, migration: Migration): Promise<any> {
    this.logger.log(`Applying migration from ${migration.from} to ${migration.to}`);
    
    try {
      const migrated = migration.migrate(workflow);
      this.logger.log(`Successfully applied migration to ${migration.to}`);
      return migrated;
    } catch (error) {
      this.logger.error(`Failed to apply migration from ${migration.from} to ${migration.to}`, error);
      throw error;
    }
  }

  private registerMigrations(): void {
    // Register version migrations here
    // Example:
    // this.migrations.set('1.0.0-to-1.1.0', {
    //   from: '1.0.0',
    //   to: '1.1.0',
    //   migrate: (workflow) => {
    //     // Migration logic
    //     return workflow;
    //   }
    // });
  }

  getSupportedVersions(): string[] {
    return Array.from(this.migrations.keys())
      .map(key => key.split('-to-')[1])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }

  isVersionSupported(version: string): boolean {
    return this.getSupportedVersions().includes(version);
  }
}