import { Logger } from '../../logging/logger.service.js';
import { EnhancedDatabaseService } from '../enhanced-database.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as path from 'path';
import * as fs from 'fs/promises';

interface MigrationMeta {
    id: string;
    name: string;
    timestamp: number;
    batch: number;
    executed_at?: string;
    duration_ms?: number;
    success: boolean;
    error?: string;
}

export class MigrationRunner {
    private readonly logger = new Logger(MigrationRunner.name);
    private initialized = false;

    constructor(
        private readonly db: EnhancedDatabaseService,
        private readonly eventEmitter: EventEmitter2,
        private readonly migrationsDir: string
    ) {}

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        await this.createMigrationsTable();
        this.initialized = true;
    }

    async getPendingMigrations(): Promise<MigrationMeta[]> {
        const results: MigrationMeta[] = [];
        const pendingMigrations = await this.getMigrations();
        
        if (pendingMigrations.length === 0) {
            this.logger.log('No pending migrations found');
            return results;
        }

        for (const migration of pendingMigrations) {
            const startTime = Date.now();
            try {
                this.logger.log(`Running migration: ${migration.name}`);
                await this.runMigration(migration);

                results.push({
                    ...migration,
                    batch: 1,
                    executed_at: new Date().toISOString(),
                    duration_ms: Date.now() - startTime,
                    success: true
                });

                this.eventEmitter.emit('database.migration.success', {
                    migration: migration.name,
                    duration: Date.now() - startTime
                });
            } catch (error) {
                this.logger.error(`Error running migration: ${migration.name}`, error);

                results.push({
                    ...migration,
                    batch: 1,
                    executed_at: new Date().toISOString(),
                    duration_ms: Date.now() - startTime,
                    success: false,
                    error: error.message
                });

                this.eventEmitter.emit('database.migration.error', {
                    migration: migration.name,
                    error
                });

                break; // Stop on first error
            }

            // Record migration result
            await this.recordMigration(results[results.length - 1]);
        }

        return results;
    }

    async rollback(steps: number = 1): Promise<MigrationMeta[]> {
        await this.initialize();
        const results: MigrationMeta[] = [];
        const completedMigrations = await this.getCompletedMigrations(steps);
        
        for (const migration of completedMigrations) {
            const startTime = Date.now();
            let error: Error | undefined;

            try {
                this.logger.log(`Rolling back migration: ${migration.name}`);
                await this.rollbackMigration(migration);

                results.push({
                    ...migration,
                    executed_at: new Date().toISOString(),
                    duration_ms: Date.now() - startTime,
                    success: true
                });

                this.eventEmitter.emit('database.migration.rollback.success', {
                    migration: migration.name,
                    duration: Date.now() - startTime
                });
            } catch (error) {
                this.logger.error(`Error rolling back migration: ${migration.name}`, error);

                results.push({
                    ...migration,
                    executed_at: new Date().toISOString(),
                    duration_ms: Date.now() - startTime,
                    success: false,
                    error: error.message
                });

                this.eventEmitter.emit('database.migration.rollback.error', {
                    migration: migration.name,
                    error
                });

                break; // Stop on first error
            }

            // Remove migration record
            await this.removeMigration(migration.id);
        }

        return results;
    }

    async reset(): Promise<void> {
        const completedCount = await this.getCompletedCount();
        return this.rollback(completedCount);
    }

    private async createMigrationsTable(): Promise<void> {
        await this.db.executeQuery(`
            CREATE TABLE IF NOT EXISTS migrations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                batch INTEGER NOT NULL,
                executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                duration_ms INTEGER,
                success BOOLEAN NOT NULL DEFAULT FALSE,
                error TEXT
            )
        `);
    }

    private async getCompletedCount(): Promise<number> {
        const result = await this.db.executeQuery<{ count: number }[]>(
            'SELECT COUNT(*) as count FROM migrations WHERE success = TRUE'
        );
        return result[0].count;
    }
    
    private async getMigrations(): Promise<MigrationMeta[]> {
        // Get list of migration files
        const files = await fs.readdir(this.migrationsDir);
        const migrations = files
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .map(f => ({
                id: path.parse(f).name,
                name: path.parse(f).name,
                timestamp: parseInt(path.parse(f).name.split('_')[0], 10),
                success: false
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

        // Get completed migrations
        const completed = await this.db.executeQuery<{ id: string }[]>(
            'SELECT id FROM migrations WHERE success = TRUE'
        );
        const completedIds = new Set(completed.map(m => m.id));
        
        // Return only pending migrations
        return migrations.filter(m => !completedIds.has(m.id));
    }

    private async getCompletedMigrations(limit: number): Promise<MigrationMeta[]> {
        return this.db.executeQuery<MigrationMeta[]>(
            `SELECT * FROM migrations 
             WHERE success = TRUE
             ORDER BY executed_at DESC
             LIMIT ?`,
            [limit]
        );
    }

    private async recordMigration(migration: MigrationMeta): Promise<void> {
        await this.db.executeQuery(
            `INSERT INTO migrations (
                id, name, batch, executed_at, duration_ms, success, error
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                migration.id,
                migration.name,
                migration.batch,
                migration.executed_at,
                migration.duration_ms,
                migration.success,
                migration.error
            ]
        );
    }

    private async removeMigration(id: string): Promise<void> {
        await this.db.executeQuery(
            'DELETE FROM migrations WHERE id = ?',
            [id]
        );
    }

    private async runMigration(migration: MigrationMeta): Promise<void> {
        const migrationPath = path.join(this.migrationsDir, `${migration.name}.ts`);
        const migrationModule = await import(migrationPath);
        
        if (typeof migrationModule.up !== 'function') {
            throw new Error(`Migration ${migration.name} does not export an 'up' function`);
        }

        await migrationModule.up(this.db);
    }

    private async rollbackMigration(migration: MigrationMeta): Promise<void> {
        const migrationPath = path.join(this.migrationsDir, `${migration.name}.ts`);
        const migrationModule = await import(migrationPath);
        
        if (typeof migrationModule.down !== 'function') {
            throw new Error(`Migration ${migration.name} does not export a 'down' function`);
        }

        await migrationModule.down(this.db);
    }
}
