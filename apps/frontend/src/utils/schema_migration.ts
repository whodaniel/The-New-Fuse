import { Logger } from './logger.js';
const logger = new Logger('SchemaMigration');
export class SchemaMigration {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
        });
        this.migrations = {};
    }
    async initialize() {
        try {
            await this.redis.ping();
            logger.info('Successfully connected to Redis');
        }
        catch (error) {
            logger.error('Failed to connect to Redis', { error });
            throw error;
        }
    }
    registerMigration(migration) {
        const versionKey = this.getVersionKey(migration.fromVersion);
        if (!this.migrations[migration.schemaType]) {
            this.migrations[migration.schemaType] = {};
        }
        this.migrations[migration.schemaType][versionKey] = migration;
    }
    async migrateSchema(schemaType, data, fromVersion) {
        const migrationPath = this.findMigrationPath(schemaType, fromVersion);
        let currentData = data;
        for (const migration of migrationPath.migrations) {
            logger.info(`Migrating from ${migration.fromVersion} to ${migration.toVersion}`);
            currentData = await migration.migrate(currentData);
        }
        return currentData;
    }
    getVersionKey(version) {
        return version.replace(/\./g, '_');
    }
    findMigrationPath(schemaType, fromVersion) {
        const migrations = [];
        let currentVersion = fromVersion;
        const schemaVersions = this.migrations[schemaType];
        if (!schemaVersions) {
            return { migrations: [], finalVersion: currentVersion };
        }
        while (schemaVersions[this.getVersionKey(currentVersion)]) {
            const migration = schemaVersions[this.getVersionKey(currentVersion)];
            if (!migration)
                break;
            migrations.push(migration);
            currentVersion = migration.toVersion;
        }
        return {
            migrations,
            finalVersion: currentVersion
        };
    }
    async migrate_1_0_0_to_1_1_0(data) {
        if (typeof data === 'object' && data !== null) {
            return Object.assign(Object.assign({}, data), { version: '1.1.0', updatedAt: new Date().toISOString(), migrated: true });
        }
        return data;
    }
    async migrate_1_1_0_to_2_0_0(data) {
        if (typeof data === 'object' && data !== null) {
            return Object.assign(Object.assign({}, data), { version: '2.0.0', schemaVersion: 2, migrated: true, lastMigration: new Date().toISOString() });
        }
        return data;
    }
    async close() {
        await this.redis.quit();
    }
}
//# sourceMappingURL=schema_migration.js.map