export declare class SchemaMigration {
    constructor();
    initialize(): Promise<void>;
    registerMigration(migration: any): void;
    migrateSchema(schemaType: any, data: any, fromVersion: any): Promise<any>;
    getVersionKey(version: any): any;
    findMigrationPath(schemaType: any, fromVersion: any): {
        migrations: any[];
        finalVersion: any;
    };
    migrate_1_0_0_to_1_1_0(data: any): Promise<any>;
    migrate_1_1_0_to_2_0_0(data: any): Promise<any>;
    close(): Promise<void>;
}
