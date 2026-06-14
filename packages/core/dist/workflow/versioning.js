var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowVersionManager_1;
import { Injectable, Logger } from '@nestjs/common';
let WorkflowVersionManager = WorkflowVersionManager_1 = class WorkflowVersionManager {
    constructor() {
        this.logger = new Logger(WorkflowVersionManager_1.name);
        this.migrations = new Map();
        this.registerMigrations();
    }
    async migrateWorkflow(workflow, targetVersion) {
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
    calculateMigrationPath(from, to) {
        const path = [];
        // Simple version comparison - in real implementation, this would be more sophisticated
        const fromParts = from.split('.').map(Number);
        const toParts = to.split('.').map(Number);
        if (fromParts[0] < toParts[0]) {
            // Major version upgrade
            const migration = this.migrations.get(`${from}-to-${to}`);
            if (migration)
                path.push(migration);
        }
        else if (fromParts[1] < toParts[1]) {
            // Minor version upgrade
            const migration = this.migrations.get(`${from}-to-${to}`);
            if (migration)
                path.push(migration);
        }
        else if (fromParts[2] < toParts[2]) {
            // Patch version upgrade
            const migration = this.migrations.get(`${from}-to-${to}`);
            if (migration)
                path.push(migration);
        }
        return path.filter(Boolean);
    }
    async applyMigration(workflow, migration) {
        this.logger.log(`Applying migration from ${migration.from} to ${migration.to}`);
        try {
            const migrated = migration.migrate(workflow);
            this.logger.log(`Successfully applied migration to ${migration.to}`);
            return migrated;
        }
        catch (error) {
            this.logger.error(`Failed to apply migration from ${migration.from} to ${migration.to}`, error);
            throw error;
        }
    }
    registerMigrations() {
        // Register version migrations here
        // Example:
        // this.migrations.set('1.0.0-to-1.1.0', {
        //   from: '1.0.0',
        //   to: '1.1.0',
        //   migrate(workflow) {
        //     // Migration logic
        //     return workflow;
        //   }
        // });
    }
    getSupportedVersions() {
        return Array.from(this.migrations.keys())
            .map(key => key.split('-to-')[1])
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
    }
    isVersionSupported(version) {
        return this.getSupportedVersions().includes(version);
    }
};
WorkflowVersionManager = WorkflowVersionManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], WorkflowVersionManager);
export { WorkflowVersionManager };
//# sourceMappingURL=versioning.js.map