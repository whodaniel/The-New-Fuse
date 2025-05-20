import { Migration } from '../types/schema.js';
export declare class SchemaMigration {
    private redis;
    private migrations;
    constructor();
    initialize(): Promise<void>;
    registerMigration(migration: Migration): void;
    migrateSchema(schemaType: string, data: unknown, fromVersion: string): Promise<unknown>;
    private getVersionKey;
    private findMigrationPath;
    migrate_1_0_0_to_1_1_0(data: unknown): Promise<unknown>;
    migrate_1_1_0_to_2_0_0(data: unknown): Promise<unknown>;
    close(): Promise<void>;
}
